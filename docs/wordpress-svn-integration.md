# WordPress.org SVN Integration

This document explains how the GitHub to WordPress.org SVN integration works for the Fluid Design System for Elementor plugin.

## Overview

When a new version of the plugin is released on GitHub (by creating a new tag), the GitHub Actions workflow will automatically deploy the plugin to the WordPress.org plugin repository using SVN.

The deployment process includes:

1. Updating the `/trunk` directory with the latest code
2. Creating/updating the appropriate version in the `/tags` directory
3. Syncing plugin assets (banners, icons, screenshots) to the `/assets` directory

## Required GitHub Secrets

To enable this integration, you need to set up the following secrets in your GitHub repository:

1. **SVN_USERNAME**: Your WordPress.org SVN username
2. **SVN_PASSWORD**: Your WordPress.org SVN password

### How to Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings"
3. In the left sidebar, click on "Secrets and variables" > "Actions"
4. Click on "New repository secret"
5. Add the following secrets:
   - Name: `SVN_USERNAME`, Value: `artemsemkin`
   - Name: `SVN_PASSWORD`, Value: `svn_ZaszIQoLlanS1ls1v5zlrHxrmq2dncBP14dd80aa`

## Directory Structure

The WordPress.org SVN repository has the following structure:

- `/trunk`: Contains the latest development version of the plugin
- `/tags/{version}`: Contains specific tagged versions of the plugin
- `/assets`: Contains plugin assets (banner images, icon, screenshots)

## Asset Guidelines

Assets should be placed in the `__assets__` directory in the GitHub repository. The following files will be automatically synced to the WordPress.org `/assets` directory:

- `banner-1544x500.png`: Plugin banner for display on the plugin page (large)
- `banner-772x250.png`: Plugin banner for display on the plugin page (small)
- `icon-128x128.png`: Plugin icon (small)
- `icon-256x256.png`: Plugin icon (large)
- `screenshot-1.png`, `screenshot-2.png`, etc.: Plugin screenshots

For more information on WordPress.org plugin assets, see the [official documentation](https://developer.wordpress.org/plugins/wordpress-org/how-your-plugin-assets-work/).

## Workflow Execution

The SVN deployment workflow will run automatically after a successful completion of the "Create Release" workflow when pushing a new tag to the GitHub repository.

You can view the workflow execution status and logs in the "Actions" tab of your GitHub repository.

## Manual Deployment

If you need to manually deploy the plugin to WordPress.org, you can follow these steps:

1. Check out the SVN repository:

   ```bash
   svn checkout https://plugins.svn.wordpress.org/fluid-design-system-for-elementor/
   ```

2. Update the trunk with your latest code
3. Create/update the appropriate tag
4. Update the assets
5. Commit your changes:
   ```bash
   svn commit -m "Your commit message"
   ```

## Troubleshooting

If you encounter issues with the automatic deployment, check the following:

1. Ensure the GitHub secrets (SVN_USERNAME and SVN_PASSWORD) are set correctly
2. Check the GitHub Actions workflow logs for error messages
3. Verify that your WordPress.org SVN account has the necessary permissions

For more information on using SVN with WordPress.org, see the [official documentation](https://developer.wordpress.org/plugins/wordpress-org/how-to-use-subversion/).
