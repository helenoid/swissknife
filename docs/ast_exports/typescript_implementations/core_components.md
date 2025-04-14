Key components in Goose MCP structure:
pub struct ComputerControllerRouter {
pub fn load_prompt_files() -> HashMap<String, Prompt> {
pub struct DeveloperRouter {
pub struct GoogleDriveRouter {
pub struct MemoryRouter {
pub trait SystemAutomation: Send + Sync {
pub fn create_system_automation() -> Box<dyn SystemAutomation + Send + Sync> {
pub enum Error {
pub struct TransportMessage {
pub trait Transport {
pub trait TransportHandle: Send + Sync + Clone + 'static {
pub struct PendingRequests {
pub struct TutorialRouter {
