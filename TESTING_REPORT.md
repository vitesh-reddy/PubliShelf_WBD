# Testing Report

## Final Status

Use these in PowerShell exactly as-is.

Unit testing (server + client):
$env:NODE_OPTIONS="--experimental-vm-modules"; Push-Location "D:\WBD PROJECT\Publishelf_WBD\server"; npx jest --runInBand --silent; Pop-Location; Push-Location "D:\WBD PROJECT\Publishelf_WBD\client"; npx jest --runInBand --silent; Pop-Location

Coverage (server + client):
$env:NODE_OPTIONS="--experimental-vm-modules"; Push-Location "D:\WBD PROJECT\Publishelf_WBD\server"; npx jest --coverage --runInBand --silent; Pop-Location; Push-Location "D:\WBD PROJECT\Publishelf_WBD\client"; npx jest --coverage --runInBand --silent; Pop-Location

- Server: Passed
- Client: Passed
- Combined: Passed

## Run Commands

Use these exact commands from PowerShell.

### Server Unit Tests

```powershell
Set-Location -Path "D:\WBD PROJECT\Publishelf_WBD\server"
$env:NODE_OPTIONS='--experimental-vm-modules'
npx jest --runInBand --silent
```

### Client Unit Tests

```powershell
Set-Location -Path "D:\WBD PROJECT\Publishelf_WBD\client"
$env:NODE_OPTIONS='--experimental-vm-modules'
npx jest --runInBand --silent
```

### Server Coverage

```powershell
Set-Location -Path "D:\WBD PROJECT\Publishelf_WBD\server"
$env:NODE_OPTIONS='--experimental-vm-modules'
npx jest --coverage --runInBand --silent
```

### Client Coverage

```powershell
Set-Location -Path "D:\WBD PROJECT\Publishelf_WBD\client"
$env:NODE_OPTIONS='--experimental-vm-modules'
npx jest --coverage --runInBand --silent
```

## Numerical Test Statistics

### Server

- Test Suites: 25 passed, 25 total
- Tests: 138 passed, 138 total
- Pass Rate (Suites): 100%
- Pass Rate (Tests): 100%

### Client

- Test Suites: 23 passed, 23 total
- Tests: 100 passed, 100 total
- Pass Rate (Suites): 100%
- Pass Rate (Tests): 100%

### Combined

- Total Test Suites: 48 passed, 48 total
- Total Tests: 238 passed, 238 total
- Combined Pass Rate (Suites): 100%
- Combined Pass Rate (Tests): 100%

## Coverage Statistics

### Server Coverage

- Statements: 83.00%
- Branches: 63.41%
- Functions: 100.00%
- Lines: 86.82%

### Client Coverage

- Statements: 98.43%
- Branches: 84.74%
- Functions: 100.00%
- Lines: 98.37%

Coverage values are based on the current `collectCoverageFrom` scope configured in `server/jest.config.js` and `client/jest.config.js` (critical business logic modules).

## Verification Snapshot

Latest validation run confirms:

1. Server tests: passed
2. Client tests: passed
3. Server coverage command: completed successfully
4. Client coverage command: completed successfully
