# i18n Sync & Cleanup Script

This directory contains utility scripts for managing internationalization (i18n) translations in the JoyfulWords project.

## i18n-sync.ts

Automatically syncs translation keys between `en.ts` and `zh.ts` and identifies unused keys.

### Features

- 🔍 **Find missing keys** - Compares `en.ts` and `zh.ts` to find translation keys that exist in one but not the other
- 🔧 **Auto-fix** - Automatically adds missing keys to keep translations in sync
- 🧹 **Clean unused** - Scans the codebase to find unused translation keys
- 🗑️ **Remove unused** - Removes unused keys to keep translation files clean

### Usage

```bash
# Show missing keys (dry run, no changes)
pnpm i18n:sync

# Add missing keys to both files
pnpm i18n:sync:fix

# Check for unused keys (dry run)
pnpm i18n:sync:clean

# Remove unused keys from both files
pnpm i18n:sync:clean --fix

# Sync and remove unused keys in one command
pnpm i18n:sync:all
```

### CLI Options

- `--fix` - Apply changes instead of dry run
- `--clean` - Check/remove unused keys
- `--all` - Sync translations AND remove unused keys

### Examples

**Example 1: Check what's missing**
```bash
pnpm i18n:sync
```
Output:
```
❌ Missing in en.ts (5 keys):
  - contentWriting.manager.materialsCount
  - contentWriting.manager.postsCount
  ...

🔍 DRY RUN - No changes made
Use --fix to apply changes
```

**Example 2: Fix missing keys**
```bash
pnpm i18n:sync:fix
```
Output:
```
🔧 Applying fixes...
  Added 5 keys to en.ts
  Added 3 keys to zh.ts
✅ Sync completed!
```

**Example 3: Clean unused keys**
```bash
pnpm i18n:sync:clean --fix
```
Output:
```
📊 Usage statistics:
  en.ts: 368/494 keys used
  zh.ts: 368/494 keys used

⚠️  Unused in en.ts (126 keys):
  - common.generate
  - common.upload
  ...

🗑️  Removing unused keys...
  Removed 126 keys from en.ts
  Removed 126 keys from zh.ts
✅ Cleanup completed!
```

### How it works

1. **Parsing**: Reads both `lib/i18n/locales/en.ts` and `lib/i18n/locales/zh.ts`
2. **Comparison**: Recursively compares the object structure to find missing keys
3. **Code scanning**: Searches all `.ts`, `.tsx`, `.js`, `.jsx` files for `t("key")` patterns
4. **Reporting**: Shows which keys are missing or unused
5. **Applying**: If `--fix` is provided, updates the files automatically

### Best Practices

1. **Run regularly**: Run `pnpm i18n:sync` after adding new translation keys
2. **Review before fixing**: Always run dry-run first to see what will change
3. **Clean before release**: Run `pnpm i18n:sync:all` before releases to remove unused keys
4. **Commit changes**: Review the git diff after auto-fix to ensure correctness

### File Structure

```
scripts/
├── i18n-sync.ts      # Main sync and cleanup script
└── README.md         # This file

lib/i18n/locales/
├── en.ts             # English translations (source of truth)
└── zh.ts             # Chinese translations
```

### Adding the script as a Skill

This script is integrated into the project as a convenient npm script, making it easy to run anytime:

```bash
# In any terminal
pnpm i18n:sync        # Quick check
pnpm i18n:sync:fix    # Apply fixes
pnpm i18n:sync:all    # Full sync + cleanup
```

### Troubleshooting

**Script fails to parse translations**
- Ensure your translation files are valid TypeScript objects
- Check for syntax errors in `en.ts` or `zh.ts`

**False positives for unused keys**
- The script searches for `t("key")` pattern
- If you use dynamic key generation, those keys may be flagged as unused
- Review the list before running with `--fix`

**Performance**
- The script scans all source files in the project
- For large projects, it may take 10-30 seconds
- Consider running it less frequently or on specific directories
