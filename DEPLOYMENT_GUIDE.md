# Budget Views Feature - Deployment Guide

## Repository Status

Your Budget Views feature has been successfully:

- ✅ Merged with Actual Budget v25.11.0
- ✅ Fixed TypeScript compatibility issues
- ✅ Pushed to your repository: `https://github.com/al3x1337/actual.git`
- ✅ Branch: `category_groups_ai`

## Building for actual-server

### Prerequisites

- Node.js >= 20
- Yarn ^4.9.1
- Git

### Build Steps

1. **Clone your repository:**

   ```bash
   git clone https://github.com/al3x1337/actual.git
   cd actual
   git checkout category_groups_ai
   ```

2. **Install dependencies:**

   ```bash
   yarn install
   ```

3. **Build the browser client:**

   ```bash
   # On Linux/Mac:
   yarn build:browser

   # On Windows (PowerShell):
   $env:NODE_OPTIONS="--max-old-space-size=4096"
   yarn workspace plugins-service build
   yarn workspace loot-core build:browser
   yarn workspace @actual-app/web build:browser
   ```

4. **Build the sync-server:**

   ```bash
   cd packages/sync-server
   yarn tsc
   yarn copy-static-assets
   ```

   Or use the build script (may need adjustments for Windows):

   ```bash
   yarn workspace @actual-app/sync-server build
   ```

### Running actual-server

After building, you can run the server:

```bash
# From the sync-server directory:
cd packages/sync-server
node build/app.js

# Or use the npm script:
yarn workspace @actual-app/sync-server start
```

### Using with Docker

You can also build a Docker image:

1. **Build the Docker image:**

   ```bash
   docker build -f sync-server.Dockerfile -t actual-server-category-groups:latest .
   ```

2. **Run with Docker:**
   ```bash
   docker run -p 5006:5006 \
     -v ./actual-data:/data \
     actual-server-category-groups:latest
   ```

### Deployment Options

#### Option 1: Direct Deployment

- Build the server as shown above
- Copy `packages/sync-server/build` and `packages/desktop-client/build` to your server
- Run `node build/app.js` from the sync-server directory

#### Option 2: Docker Deployment

- Build Docker image from your repository
- Deploy to any Docker-compatible platform (Docker Hub, AWS ECS, etc.)

#### Option 3: GitHub Actions / CI/CD

- Create a workflow that builds and deploys on push
- Use the existing `.github/workflows/` as reference

## What's Included

Your Budget Views feature includes:

- ✅ 4 new components (BudgetViews, BudgetViewsPage, EditBudgetViewModal, CategoryFilterSelector)
- ✅ Integration with budget table filtering
- ✅ TypeScript types and preferences
- ✅ Compatible with Actual Budget v25.11.0

## Verification

After deployment, verify the feature works:

1. Access the Budget Views page via sidebar or `/budget-views` route
2. Create a budget view
3. Assign categories to views
4. Filter the budget table by budget views

## Troubleshooting

### Build Errors

- Ensure Node.js >= 20
- Clear node_modules and reinstall: `rm -rf node_modules && yarn install`
- Check TypeScript errors: `yarn typecheck`

### Runtime Errors

- Check server logs for errors
- Verify all dependencies are installed
- Ensure build artifacts are in correct locations

## Next Steps

1. **Test locally** before deploying to production
2. **Create a release tag** for version tracking:

   ```bash
   git tag -a v25.11.0-budget-views -m "Budget Views feature on v25.11.0"
   git push origin v25.11.0-budget-views
   ```

3. **Document your deployment** for your team/users

## Support

For issues or questions:

- Check the main Actual Budget docs: https://actualbudget.org/docs
- Review your feature documentation: `BUDGET_VIEWS_FEATURE.md`
