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
