## Module: platform - mod.rs
```rust
mod linux;
mod macos;
mod windows;
pub use self::windows::WindowsAutomation;
pub use self::macos::MacOSAutomation;
pub use self::linux::LinuxAutomation;
pub trait SystemAutomation: Send + Sync {
pub fn create_system_automation() -> Box<dyn SystemAutomation + Send + Sync> {
```
