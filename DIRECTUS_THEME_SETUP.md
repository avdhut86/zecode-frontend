# Directus Backend Theme Setup

To enable dynamic control of your website's Header and Footer, you need to configure a **Singleton** collection in Directus named `globals`.

## 1. Create the Collection
1.  Log in to your Directus Admin Panel.
2.  Go to **Settings** > **Data Model**.
3.  Click **+ Create Collection**.
4.  **Name**: `globals` (Key: `globals`).
5.  **Type**: Select **Singleton** (Treat as a single object).
6.  **Save** the collection.

## 2. Add Fields
Add the following fields to the `globals` collection. The field keys (names) must match exactly.

### General
-   **`site_name`** (Type: Input / String): The name of your site (e.g., "Zecode").
-   **`site_logo`** (Type: Image / File): Upload your logo file here.

### Header Navigation
-   **`header_nav`** (Type: JSON / Repeater):
    -   This field should store an array of link objects.
    -   **Recommended Interface**: "Repeater" or "JSON".
    -   **Structure**: Each item should have:
        -   `label` (String): Link text (e.g., "Men").
        -   `href` (String): Link URL (e.g., "/men").
    -   *Note: The first 3 items will be used for the top utility bar (Lit Zone, Store Locator, About), and the rest for the main category navigation.*

### Footer Navigation
-   **`footer_nav`** (Type: JSON / Repeater):
    -   **Structure**: Same as `header_nav` (`label`, `href`).
    -   These links appear in the "Links" column of the footer.

### Social Links
-   **`social_links`** (Type: JSON / Repeater):
    -   **Structure**:
        -   `label` (String): e.g., "Instagram".
        -   `href` (String): e.g., "https://instagram.com/zecode".
        -   `icon` (String / Text Area): SVG path data for the icon (optional).

### Footer Text
-   **`footer_text`** (Type: Text Area): The short description text that appears below the logo in the footer.

## 3. Public Permissions
1.  Go to **Settings** > **Roles & Permissions**.
2.  Click on the **Public** role.
3.  Find the `globals` collection.
4.  Click the **Read** (eye icon) permission to set it to "All Access" (check mark).
5.  This allows your frontend to fetch these settings without an API key.

## 4. Verify
Once set up, your Next.js application will automatically fetch these settings.
-   If the fetch succeeds, your site will show the content from Directus.
-   If the fetch fails (or fields are empty), it will gracefully fall back to the default hardcoded values.
