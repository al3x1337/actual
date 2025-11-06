// @ts-strict-ignore
import { SQLiteFS } from 'absurd-sql';
import IndexedDBBackend from 'absurd-sql/dist/indexeddb-backend';

import * as connection from '../connection';
import * as idb from '../indexeddb';
import { _getModule, SqlJsModule } from '../sqlite';

import { join } from './path-join';

let FS: SqlJsModule['FS'] = null;
let BFS = null;
const NO_PERSIST = false;

export const bundledDatabasePath = '/default-db.sqlite';
export const migrationsPath = '/migrations';
export const demoBudgetPath = '/demo-budget';
export { join };
export { getDocumentDir, getBudgetDir, _setDocumentDir } from './shared';
export const getDataDir = () => process.env.ACTUAL_DATA_DIR;

export const pathToId = function (filepath: string): string {
  return filepath.replace(/^\//, '').replace(/\//g, '-');
};

function _exists(filepath: string): boolean {
  try {
    FS.readlink(filepath);
    return true;
  } catch (e) {}

  try {
    FS.stat(filepath);
    return true;
  } catch (e) {}
  return false;
}

function _mkdirRecursively(dir) {
  const parts = dir.split('/').filter(str => str !== '');
  let path = '';
  for (const part of parts) {
    path += '/' + part;
    if (!_exists(path)) {
      FS.mkdir(path);
    }
  }
}

function _createFile(filepath: string) {
  // This can create the file. Check if it exists, if not create a
  // symlink if it's a sqlite file. Otherwise store in idb

  if (!NO_PERSIST && filepath.startsWith('/documents')) {
    if (filepath.endsWith('.sqlite')) {
      // If it doesn't exist, we need to create a symlink
      if (!_exists(filepath)) {
        FS.symlink('/blocked/' + pathToId(filepath), filepath);
      }
    } else {
      // The contents are actually stored in IndexedDB. We only write to
      // the in-memory fs to take advantage of the file hierarchy
      FS.writeFile(filepath, '!$@) this should never read !$@)');
    }
  }

  return filepath;
}

async function _readFile(
  filepath: string,
  opts?: { encoding: 'utf8' } | { encoding: 'binary' },
): Promise<string | Uint8Array> {
  // We persist stuff in /documents, but don't need to handle sqlite
  // file specifically because those are symlinked to a separate
  // filesystem and will be handled in the BlockedFS
  if (
    !NO_PERSIST &&
    filepath.startsWith('/documents') &&
    !filepath.endsWith('.sqlite')
  ) {
    if (!_exists(filepath)) {
      throw new Error('File does not exist: ' + filepath);
    }

    // Grab contents from IDB
    const { store } = idb.getStore(await idb.getDatabase(), 'files');
    const item = await idb.get(store, filepath);

    if (item == null) {
      throw new Error('File does not exist: ' + filepath);
    }

    if (opts?.encoding === 'utf8' && ArrayBuffer.isView(item.contents)) {
      return String.fromCharCode.apply(
        null,
        new Uint16Array(item.contents.buffer),
      );
    }

    return item.contents;
  } else {
    if (opts?.encoding === 'utf8') {
      return FS.readFile(resolveLink(filepath), { encoding: 'utf8' });
    } else if (opts?.encoding === 'binary') {
      return FS.readFile(resolveLink(filepath), { encoding: 'binary' });
    } else {
      return FS.readFile(resolveLink(filepath));
    }
  }
}

function resolveLink(path: string): string {
  try {
    const { node } = FS.lookupPath(path, { follow: false });
    return node.link ? FS.readlink(path) : path;
  } catch (e) {
    return path;
  }
}

async function _writeFile(filepath: string, contents): Promise<boolean> {
  if (contents instanceof ArrayBuffer) {
    contents = new Uint8Array(contents);
  } else if (ArrayBuffer.isView(contents)) {
    contents = new Uint8Array(contents.buffer);
  }

  // We always create the file if it doesn't exist, and this function
  // setups up the file depending on its type
  _createFile(filepath);

  if (!NO_PERSIST && filepath.startsWith('/documents')) {
    const isDb = filepath.endsWith('.sqlite');

    // Write to IDB
    const { store } = idb.getStore(await idb.getDatabase(), 'files');

    if (isDb) {
      // We never write the contents of the database to idb ourselves.
      // It gets handled via a symlink to the blocked fs (created by
      // `_createFile` above). However, we still need to record an
      // entry for the db file so the fs gets properly constructed on
      // startup
      await idb.set(store, { filepath, contents: '' });

      // Actually persist the data by going the FS, which will pass
      // the data through the symlink to the blocked fs. For some
      // reason we need to resolve symlinks ourselves.
      await Promise.resolve();
      FS.writeFile(resolveLink(filepath), contents);
    } else {
      await idb.set(store, { filepath, contents });
    }
  } else {
    FS.writeFile(resolveLink(filepath), contents);
  }
  return true;
}

async function _copySqlFile(
  frompath: string,
  topath: string,
): Promise<boolean> {
  _createFile(topath);

  const { store } = await idb.getStore(await idb.getDatabase(), 'files');
  await idb.set(store, { filepath: topath, contents: '' });
  
  // For files not in /documents (like /default-db.sqlite), they're stored in regular FS
  // and won't have an IndexedDB entry. We need to read from FS and copy to BlockedFS.
  let fromDbPath: string;
  const fromitem = await idb.get(store, frompath);
  
  // Check if file exists in IndexedDB and has a valid filepath property
  // Added defensive check to prevent "Cannot read properties of undefined" error
  if (fromitem != null && typeof fromitem === 'object' && 'filepath' in fromitem) {
    const filepathValue = (fromitem as { filepath?: string }).filepath;
    if (filepathValue) {
      // File is in IndexedDB (in /documents), use its filepath
      fromDbPath = pathToId(filepathValue);
    } else {
      // Filepath exists but is empty/null, treat as not in IndexedDB
      // Fall through to else block
      if (!_exists(frompath)) {
        throw new Error(`Source file ${frompath} does not exist in filesystem`);
      }
      fromDbPath = pathToId(frompath);
      try {
        const contents = FS.readFile(resolveLink(frompath));
        const uint8Contents = contents instanceof Uint8Array ? contents : new Uint8Array(contents);
        const toDbPath = pathToId(topath);
        const tofile = BFS.backend.createFile(toDbPath);
        tofile.open();
        tofile.write(uint8Contents, 0, uint8Contents.length, 0);
        tofile.close();
        return true;
      } catch (err) {
        throw new Error(`Failed to copy file from ${frompath} to ${topath}: ${err.message}`);
      }
    }
  } else {
    // File is not in IndexedDB (likely in root like /default-db.sqlite)
    // First, ensure it exists in regular FS
    if (!_exists(frompath)) {
      throw new Error(`Source file ${frompath} does not exist in filesystem`);
    }
    
    // Read it from FS and write it directly to destination in BlockedFS
    // Instead of creating it in BlockedFS first and then copying, write directly
    fromDbPath = pathToId(frompath);
    
    try {
      // Read the file from regular FS
      const contents = FS.readFile(resolveLink(frompath));
      const uint8Contents = contents instanceof Uint8Array ? contents : new Uint8Array(contents);
      
      // Write directly to destination BlockedFS (no need for intermediate copy)
      const toDbPath = pathToId(topath);
      const tofile = BFS.backend.createFile(toDbPath);
      tofile.open();
      tofile.write(uint8Contents, 0, uint8Contents.length, 0);
      tofile.close();
      
      return true;
    } catch (err) {
      throw new Error(`Failed to copy file from ${frompath} to ${topath}: ${err.message}`);
    }
  }
  
  // If we get here, the source file is in IndexedDB (in /documents)
  // Copy from one BlockedFS file to another
  const toDbPath = pathToId(topath);

  const fromfile = BFS.backend.createFile(fromDbPath);
  const tofile = BFS.backend.createFile(toDbPath);

  try {
    fromfile.open();
    tofile.open();
    
    // Check if source file has valid metadata
    if (!fromfile.meta || typeof fromfile.meta.size !== 'number') {
      throw new Error(`Source file ${frompath} has invalid metadata`);
    }
    
    const fileSize = fromfile.meta.size;
    const blockSize = fromfile.meta.blockSize || 4096;

    const buffer = new ArrayBuffer(blockSize);
    const bufferView = new Uint8Array(buffer);

    for (let i = 0; i < fileSize; i += blockSize) {
      const bytesToRead = Math.min(blockSize, fileSize - i);
      fromfile.read(bufferView, 0, bytesToRead, i);
      tofile.write(bufferView, 0, bytesToRead, i);
    }
  } catch (error) {
    try {
      tofile.close();
    } catch {}
    try {
      fromfile.close();
    } catch {}
    try {
      _removeFile(toDbPath);
    } catch {}
    console.error('Failed to copy database file', error);
    throw error;
  } finally {
    try {
      tofile.close();
    } catch {}
    try {
      fromfile.close();
    } catch {}
  }

  return true;
}

async function _removeFile(filepath: string) {
  if (!NO_PERSIST && filepath.startsWith('/documents')) {
    const isDb = filepath.endsWith('.sqlite');

    // Remove from IDB
    const { store } = idb.getStore(await idb.getDatabase(), 'files');
    await idb.del(store, filepath);

    // If this is the database, is has been symlinked and we want to
    // remove the actual contents
    if (isDb) {
      const linked = resolveLink(filepath);
      // Be resilient to fs corruption: don't throw an error by trying
      // to remove a file that doesn't exist. For some reason the db
      // file is gone? It's ok, just ignore it
      if (_exists(linked)) {
        FS.unlink(linked);
      }
    }
  }

  // Finally, remove any in-memory instance
  FS.unlink(filepath);
}

// Load files from the server that should exist by default
async function populateDefaultFilesystem() {
  const index = await (
    await fetch(process.env.PUBLIC_URL + 'data-file-index.txt')
  ).text();
  const files = index
    .split('\n')
    .map(name => name.trim())
    .filter(name => name !== '');
  const fetchFile = url => fetch(url).then(res => res.arrayBuffer());

  // This is hardcoded. We know we must create the migrations
  // directory, it's not worth complicating the index to support
  // creating arbitrary folders.
  await mkdir('/migrations');
  await mkdir('/demo-budget');

  await Promise.all(
    files.map(async file => {
      const contents = await fetchFile(process.env.PUBLIC_URL + 'data/' + file);
      _writeFile('/' + file, contents);
    }),
  );
}

export const populateFileHeirarchy = async function () {
  const { store } = idb.getStore(await idb.getDatabase(), 'files');
  const req = store.getAllKeys();
  const paths: string[] = await new Promise((resolve, reject) => {
    // @ts-expect-error fix me
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e);
  });

  for (const path of paths) {
    _mkdirRecursively(basename(path));
    _createFile(path);
  }
};

export const init = async function () {
  const Module = _getModule();
  FS = Module.FS;

  // When a user "uploads" a file, we just put it in memory in this
  // dir and the backend takes it from there
  FS.mkdir('/uploads');

  // Files in /documents are actually read/written from idb.
  // Everything in there is automatically persisted
  FS.mkdir('/documents');

  // Files in /blocked are handled by the BlockedFS, which is a
  // special fs that persists files in blocks. This is necessary
  // for sqlite3
  FS.mkdir('/blocked');

  // Jest doesn't support workers. Right now we disable the blocked fs
  // backend under testing and just test that the directory structure
  // is created correctly. We assume the the absurd-sql project tests
  // the blocked fs enough. Additionally, we don't populate the
  // default files in testing.
  if (process.env.NODE_ENV !== 'test') {
    const backend = new IndexedDBBackend(() => {
      connection.send('fallback-write-error');
    });
    BFS = new SQLiteFS(FS, backend);
    Module.register_for_idb(BFS);

    FS.mount(BFS, {}, '/blocked');

    await populateDefaultFilesystem();
  }

  await populateFileHeirarchy();
};

export const basename = function (filepath) {
  const parts = filepath.split('/');
  return parts.slice(0, -1).join('/');
};

export const listDir = async function (filepath) {
  const paths = FS.readdir(filepath);
  return paths.filter(p => p !== '.' && p !== '..');
};

export const exists = async function (filepath) {
  return _exists(filepath);
};

export const mkdir = async function (filepath) {
  FS.mkdir(filepath);
};

export const size = async function (filepath) {
  const attrs = FS.stat(resolveLink(filepath));
  return attrs.size;
};

export const copyFile = async function (
  frompath: string,
  topath: string,
): Promise<boolean> {
  let result = false;
  try {
    const contents = await _readFile(frompath);
    result = await _writeFile(topath, contents);
  } catch (error) {
    if (frompath.endsWith('.sqlite') || topath.endsWith('.sqlite')) {
      try {
        result = await _copySqlFile(frompath, topath);
      } catch (secondError) {
        throw new Error(
          `Failed to copy SQL file from ${frompath} to ${topath}: ${secondError.message}`,
        );
      }
    } else {
      throw error;
    }
  }
  return result;
};

export const readFile = async function (
  filepath: string,
  encoding: 'binary' | 'utf8' = 'utf8',
) {
  return _readFile(filepath, { encoding });
};

export const writeFile = async function (filepath: string, contents) {
  return _writeFile(filepath, contents);
};

export const removeFile = async function (filepath: string) {
  return _removeFile(filepath);
};

export const removeDir = async function (filepath) {
  FS.rmdir(filepath);
};

export const removeDirRecursively = async function (dirpath) {
  if (await exists(dirpath)) {
    for (const file of await listDir(dirpath)) {
      const fullpath = join(dirpath, file);
      // `true` here means to not follow symlinks
      const attr = FS.stat(fullpath, true);

      if (FS.isDir(attr.mode)) {
        await removeDirRecursively(fullpath);
      } else {
        await removeFile(fullpath);
      }
    }

    await removeDir(dirpath);
  }
};

export const getModifiedTime = async function () {
  throw new Error(
    'getModifiedTime not supported on the web (only used for backups)',
  );
};
