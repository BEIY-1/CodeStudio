import { crashReporter, app } from 'electron'
import { join } from 'path'

export function setupCrashReporter(): void {
  crashReporter.start({
    productName: 'CodeStudio',
    companyName: 'CodeStudio',
    submitURL: '',
    uploadToServer: false,
    crashesDirectory: join(app.getPath('userData'), 'crashes'),
  })
}
