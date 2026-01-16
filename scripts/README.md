# i18n Sync & Cleanup Script

This directory contains utility scripts for managing internationalization (i18n) translations in the JoyfulWords project.

## i18n-sync.ts

Automatically syncs translation keys between `en.ts` and `zh.ts` and identifies unused keys.

### Features

- 🔍 **Find missing keys** - Compares `en.ts` and `zh.ts` to find translation keys that exist in one but not the other
- 🧹 **Clean unused** - Scans the codebase to find and remove unused translation keys

### Usage

```bash
# Check for missing and unused keys (dry run, no changes)
pnpm i18n:sync

# Remove unused keys from both files
pnpm i18n:sync:clean
```

### Examples

**Example 1: Check what's missing**
```bash
pnpm i18n:sync
```
Output:
```
🔍 Analyzing translation files...

Finding missing keys...
✅ No missing keys found!

🔍 DRY RUN - No changes made
Use --clean to remove unused keys
```

**Example 2: Clean unused keys**
```bash
pnpm i18n:sync:clean
```
Output:
```
🧹 Checking for unused keys...

📊 Usage statistics:
  en.ts: 368/494 keys used
  zh.ts: 368/494 keys used

⚠️  Unused in en.ts (126 keys):
  - common.generate
  - common.upload
  ...

🗑️  Removing unused keys...
  ✅ Removed 126 keys from en.ts
  ✅ Removed 126 keys from zh.ts

✅ Cleanup completed!
```

### How it works

1. **Parsing**: Reads both `lib/i18n/locales/en.ts` and `lib/i18n/locales/zh.ts`
2. **Comparison**: Recursively compares the object structure to find missing keys
3. **Code scanning**: Searches all `.ts`, `.tsx`, `.js`, `.jsx` files for `t("key")` patterns
4. **Reporting**: Shows which keys are missing or unused
5. **Cleanup**: When using `--clean`, automatically removes unused keys

### Best Practices

1. **Run regularly**: Run `pnpm i18n:sync` after adding new translation keys
2. **Clean before release**: Run `pnpm i18n:sync:clean` before releases to remove unused keys
3. **Review changes**: Check the git diff after cleanup to ensure correctness

### Troubleshooting

**Script fails to parse translations**
- Ensure your translation files are valid TypeScript objects
- Check for syntax errors in `en.ts` or `zh.ts`

**False positives for unused keys**
- The script searches for `t("key")` pattern
- If you use dynamic key generation, those keys may be flagged as unused
- Review the list before running cleanup

**Performance**
- The script scans all source files in the project
- For large projects, it may take 10-30 seconds

