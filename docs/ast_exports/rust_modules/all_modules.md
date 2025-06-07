## Module: computercontroller - mod.rs
```rust
use base64::Engine;
use etcetera::{choose_app_strategy, AppStrategy};
use indoc::{formatdoc, indoc};
use reqwest::{Client, Url};
use serde_json::{json, Value};
use std::{
use tokio::process::Command;
use mcp_core::{
use mcp_server::router::CapabilitiesBuilder;
use mcp_server::Router;
mod docx_tool;
mod pdf_tool;
mod presentation_tool;
mod xlsx_tool;
mod platform;
use platform::{create_system_automation, SystemAutomation};
pub struct ComputerControllerRouter {
```
## Module: developer - mod.rs
```rust
mod lang;
mod shell;
use anyhow::Result;
use base64::Engine;
use etcetera::{choose_app_strategy, AppStrategy};
use indoc::formatdoc;
use serde_json::{json, Value};
use std::{
use tokio::process::Command;
use url::Url;
use include_dir::{include_dir, Dir};
use mcp_core::{
use mcp_core::{
use mcp_server::router::CapabilitiesBuilder;
use mcp_server::Router;
use mcp_core::role::Role;
use self::shell::{
use indoc::indoc;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use xcap::{Monitor, Window};
use ignore::gitignore::{Gitignore, GitignoreBuilder};
pub fn load_prompt_files() -> HashMap<String, Prompt> {
pub struct DeveloperRouter {
mod tests {
```
## Module: google_drive - mod.rs
```rust
mod oauth_pkce;
pub mod storage;
use anyhow::{Context, Error};
use base64::Engine;
use indoc::indoc;
use lazy_static::lazy_static;
use mcp_core::tool::ToolAnnotations;
use oauth_pkce::PkceOAuth2Client;
use regex::Regex;
use serde_json::{json, Value};
use std::io::Cursor;
use std::{env, fs, future::Future, path::Path, pin::Pin, sync::Arc};
use storage::CredentialsManager;
use mcp_core::content::Content;
use mcp_core::{
use mcp_server::router::CapabilitiesBuilder;
use mcp_server::Router;
use google_docs1::{self, Docs};
use google_drive3::common::ReadSeek;
use google_drive3::{
use google_sheets4::{self, Sheets};
use http_body_util::BodyExt;
pub const KEYCHAIN_SERVICE: &str = "mcp_google_drive";
pub const KEYCHAIN_USERNAME: &str = "oauth_credentials";
pub const KEYCHAIN_DISK_FALLBACK_ENV: &str = "GOOGLE_DRIVE_DISK_FALLBACK";
pub struct GoogleDriveRouter {
mod tests {
```
## Module: memory - mod.rs
```rust
use async_trait::async_trait;
use etcetera::{choose_app_strategy, AppStrategy};
use indoc::formatdoc;
use serde_json::{json, Value};
use std::{
use mcp_core::{
use mcp_server::router::CapabilitiesBuilder;
use mcp_server::Router;
pub struct MemoryRouter {
```
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
## Module: src - lib.rs
```rust
use etcetera::AppStrategyArgs;
use once_cell::sync::Lazy;
pub static APP_STRATEGY: Lazy<AppStrategyArgs> = Lazy::new(|| AppStrategyArgs {
pub mod computercontroller;
mod developer;
pub mod google_drive;
mod jetbrains;
mod memory;
mod tutorial;
pub use computercontroller::ComputerControllerRouter;
pub use developer::DeveloperRouter;
pub use google_drive::GoogleDriveRouter;
pub use jetbrains::JetBrainsRouter;
pub use memory::MemoryRouter;
pub use tutorial::TutorialRouter;
```
## Module: transport - mod.rs
```rust
use async_trait::async_trait;
use mcp_core::protocol::JsonRpcMessage;
use std::collections::HashMap;
use thiserror::Error;
use tokio::sync::{mpsc, oneshot, RwLock};
pub type BoxError = Box<dyn std::error::Error + Sync + Send>;
pub enum Error {
pub struct TransportMessage {
pub trait Transport {
pub trait TransportHandle: Send + Sync + Clone + 'static {
pub async fn send_message(
pub struct PendingRequests {
pub mod stdio;
pub use stdio::StdioTransport;
pub mod sse;
pub use sse::SseTransport;
```
## Module: tutorial - mod.rs
```rust
use anyhow::Result;
use include_dir::{include_dir, Dir};
use indoc::formatdoc;
use serde_json::{json, Value};
use std::{future::Future, pin::Pin};
use mcp_core::{
use mcp_server::router::CapabilitiesBuilder;
use mcp_server::Router;
use mcp_core::content::Content;
pub struct TutorialRouter {
```
