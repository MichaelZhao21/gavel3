use chrono::Utc;
use mongodb::Database;
use serde::{Deserialize, Serialize};
use std::error::Error;

use crate::{
    db::{
        models::{Judge, Project},
        options::get_options,
    },
    str_opt,
};

#[derive(Debug, Deserialize, Serialize)]
pub struct DevpostProject {
    pub title: String,
    pub url: Option<String>,
    pub description: Option<String>,
    pub try_link: Option<String>,
    pub video_link: Option<String>,
    pub challenge_list: Vec<String>,   // List of "Opt-in Prizes"
    pub custom_questions: Vec<String>, // All custom questions
}

/// Generate a workable CSV for Jury based on the output CSV from Devpost
/// Columns:
///     0. Project Title - title
///     1. Submission Url - url
///     2. Project Status - Draft or Submitted (ignore drafts)
///     3. Judging Status - ignore
///     4. Highest Step Completed - ignore
///     5. Project Created At - ignore
///     6. About The Project - description
///     7. """Try it out"" Links" - try_link
///     8. Video Demo Link - video_link
///     9. Opt-In Prizes - challenge_list
///     10. Built With - ignore
///     11. Notes - ignore
///     12. Team Colleges/Universities - ignore
///     13. Additional Team Member Count - ignore
///     14+. Custom questions - custom_questions
pub async fn devpost_integration(
    data: String,
    db: &Database,
) -> Result<Vec<Project>, Box<dyn Error>> {
    // Create a CSV reader
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .from_reader(data.as_bytes());
    let mut err_vec = Vec::new();
    let mut project_list = Vec::new();

    // Get options object
    let mut options = get_options(db).await?;

    // Iterate through all records
    for result in reader.records() {
        // Unwrap the record
        let record = result?;

        // Add to error vector if the record is not the correct length
        if record.len() < 13 {
            err_vec.push(
                record
                    .iter()
                    .map(|x| x.to_string())
                    .collect::<Vec<String>>()
                    .join(","),
            );
            continue;
        }

        // Create list of challenges from the "Opt-In Prizes" column
        let challenge_list = record[9]
            .split(',')
            .map(|x| x.to_string())
            .collect::<Vec<String>>();

        // // Create list of custom questions from every column after the 14th
        // let mut custom_questions = Vec::new();
        // for i in 14..record.len() {
        //     // If the question is empty, skip it
        //     if record[i].is_empty() {
        //         continue;
        //     }

        //     // Add the question to the list
        //     custom_questions.push(record[i].to_string());
        // }

        // Create a new Project
        project_list.push(Project {
            id: None,
            name: record[0].to_string(),
            location: options.get_next_table_num().into(),
            description: record[6].to_string(),
            try_link: str_opt!(record[7]),
            video_link: str_opt!(record[8]),
            challenge_list,
            seen: 0,
            votes: 0,
            mu: 0f64,
            sigma_sq: 1f64,
            active: true,
            prioritized: false,
            last_activity: Utc::now(),
        });
    }

    // Save options
    options.save(db).await?;

    if err_vec.len() > 0 {
        eprintln!("Errors: {:?}", err_vec);
    }

    Ok(project_list)
}

pub async fn parse_judge_csv(data: String, has_header: bool) -> Result<Vec<Judge>, Box<dyn Error>> {
    // Create a CSV reader
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(has_header)
        .from_reader(data.as_bytes());
    let mut err_vec = Vec::new();
    let mut judge_list = Vec::new();

    // Iterate through all records
    for result in reader.records() {
        // Unwrap the record
        let record = result?;

        // Add to error vector if the record is not the correct length
        if record.len() != 3 {
            err_vec.push(
                record
                    .iter()
                    .map(|x| x.to_string())
                    .collect::<Vec<String>>()
                    .join(","),
            );
            continue;
        }

        // Create a new Judge
        // TODO: Check if email field is valid (maybe?)
        judge_list.push(Judge::new(
            record[0].trim().to_string(),
            record[1].trim().to_string(),
            record[2].trim().to_string(),
        ));
    }

    if err_vec.len() > 0 {
        eprintln!("Errors: {:?}", err_vec);
        return Err(format!("Unable to parse CSV, first error on line: {}", err_vec[0]).into());
    }

    Ok(judge_list)
}
