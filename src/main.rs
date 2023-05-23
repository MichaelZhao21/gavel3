use dotenv::dotenv;
use jury::api::client::CORS;
use jury::util::tasks::init_threads;
use rocket::fs::{relative, FileServer};
use std::env;
use std::sync::Arc;

use jury::api::{admin, client, judge, project};
use jury::{db, util};

#[macro_use]
extern crate rocket;

#[launch]
async fn rocket() -> _ {
    // Load environmental variables from .env file
    dotenv().ok();

    // Check to make sure all env vars are there
    util::check_env::check();

    // Initialize database
    let init_result = db::init::init_db();
    let db = Arc::new(init_result.await.expect("Could not connect to MongoDB!"));

    // Select FileServer
    let fileserver_path = env::var("FILESERVER").unwrap_or_else(|_| "".to_string());
    let files = if fileserver_path.starts_with("/") {
        FileServer::from(fileserver_path)
    } else {
        FileServer::from(relative!("public"))
    };

    // Initialize all threads
    // and get sender for sending new message senders (new client connections)
    // and a sender for sending clock updates from clients
    // This will be used for 2 purposes:
    // 1) MongoDB ChangeStream listener
    // 2) Synchronizing clock between clients
    // See https://cdn.michaelzhao.xyz/archive/jury-network.png
    // TODO: Do we want to save the clock state in the database?
    let (vector_tx, clock_tx, clock_state) = init_threads(db.clone()).await;

    // Start server
    rocket::build()
        .manage(db.clone())
        .manage(vector_tx)
        .manage(clock_tx)
        .manage(clock_state)
        .mount(
            "/api",
            routes![
                judge::get_judges,
                judge::login,
                judge::new_judge,
                judge::judge_read_welcome,
                judge::preview_judges_csv,
                judge::add_judges_csv,
                judge::judge_stats,
                project::get_projects,
                project::new_project,
                project::preview_projects_csv,
                project::add_projects_csv,
                project::add_devpost_csv,
                admin::login,
                admin::get_stats,
                admin::req_sync,
                admin::clock,
                admin::pause_clock,
                admin::unpause_clock,
                admin::reset_clock,
            ],
        )
        .mount("/", routes![client::home, client::all_options])
        .mount("/", files)
        .attach(CORS)
}
