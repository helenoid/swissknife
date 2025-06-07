/**
 * Unit tests for ReleasePackager
 */
import * as childProcess from 'child_process';
// Mock child_process.exec
jest.mock('child_process', () => ({
    exec: jest.fn((cmd, callback) => {
        callback(null, { stdout: 'success', stderr: '' });
    })
}));
describe('ReleasePackager', () => {
    let packager;
    beforeEach(() => {
        // Reset the mock
        jest.clearAllMocks();
        // Create the packager instance
        packager = new ReleasePackager();
    });
    describe('packageForLinux', () => {
        it('should execute the pkg command for Linux', async () => {
            // Act
            await packager.packageForLinux();
            // Assert
            expect(childProcess.exec).toHaveBeenCalledWith(expect.stringMatching(/pkg .* --targets node16-linux-x64 --output dist\/swissknife-linux/), expect.any(Function));
        });
    });
    describe('packageForMacOS', () => {
        it('should execute the pkg command for macOS', async () => {
            // Act
            await packager.packageForMacOS();
            // Assert
            expect(childProcess.exec).toHaveBeenCalledWith(expect.stringMatching(/pkg .* --targets node16-macos-x64 --output dist\/swissknife-macos/), expect.any(Function));
        });
    });
    describe('packageForWindows', () => {
        it('should execute the pkg command for Windows', async () => {
            // Act
            await packager.packageForWindows();
            // Assert
            expect(childProcess.exec).toHaveBeenCalledWith(expect.stringMatching(/pkg .* --targets node16-win-x64 --output dist\/swissknife-windows.exe/), expect.any(Function));
        });
    });
    describe('createPackages', () => {
        it('should call all platform packaging methods', async () => {
            // Arrange
            const linuxSpy = jest.spyOn(packager, 'packageForLinux').mockResolvedValue();
            const macosSpy = jest.spyOn(packager, 'packageForMacOS').mockResolvedValue();
            const windowsSpy = jest.spyOn(packager, 'packageForWindows').mockResolvedValue();
            // Act
            await packager.createPackages();
            // Assert
            expect(linuxSpy).toHaveBeenCalled();
            expect(macosSpy).toHaveBeenCalled();
            expect(windowsSpy).toHaveBeenCalled();
        });
        it('should continue if one platform fails', async () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
            // Mock exec to fail for macOS
            childProcess.exec.mockImplementation((cmd, callback) => {
                if (cmd.includes('macos')) {
                    callback(new Error('macOS packaging failed'), null);
                }
                else {
                    callback(null, { stdout: 'success', stderr: '' });
                }
            });
            // Act & Assert - should not throw an error
            await expect(packager.createPackages()).resolves.not.toThrow();
            // Clean up
            consoleErrorSpy.mockRestore();
            consoleLogSpy.mockRestore();
        });
    });
});
//# sourceMappingURL=packager.test.js.map