interface Project {
    id: string;
    name: string;
    location: number;
    mu: number;
    sigma_sq: number;
    votes: number;
    seen: number;
    description: string;
    active: boolean;
    prioritized: boolean;
    last_activity: number;
}

interface PublicProject {
    name: string;
    location: number;
    description: string;
    url: string;
    try_link: string;
    video_link: string;
    challenge_list: string;
}

interface Judge {
    id: string;
    name: string;
    email: string;
    notes: string;
    alpha: number;
    votes: number;
    beta: number;
    last_activity: number;
    read_welcome: boolean;
    seen_projects: JudgedProject[];
    active: boolean;
    next: string;
    prev: string;
}

interface Stats {
    projects: number;
    avg_seen: number;
    avg_votes: number;
    max_mu: number;
    avg_sigma: number;
    judges: number;
}

type SortField = ProjectSortField | JudgeSortField;

interface SortState<T extends SortField> {
    field: T;
    ascending: boolean;
}

interface JudgeVoteRes {
    judge_id: string;
    prev_project_id: string;
    next_project_id: string;
}

type VotePopupState = 'vote' | 'skip' | 'flag';

interface VotingProjectInfo {
    curr_name: string;
    curr_location: number;
    prev_name: string;
    prev_location: number;
}

interface OkResponse {
    ok: number;
}

interface TokenResponse {
    token: string;
}

interface JudgedProject {
    project_id: string;
    name: string;
    description: string;
    stars: number;
}

interface ClockState {
    time: number;
    running: boolean;
}

interface JudgeIpo {
    initial: number;
    project_id: string;
}

interface ProjectCount {
    count: number;
}

interface Flag {
    id: string;
    judge_id: string;
    project_id: string;
    time: number;
    project_name: string;
    judge_name: string;
    project_location: number;
    reason: string;
}

interface Options {
    curr_table_num: number;
    clock: ClockState;
    groups: Group[];
    use_groups: boolean;
    judging_timer: number;
}

interface Group {
    start: number;
    end: number;
}

interface FetchResponse<T> {
    status: number;
    error: string;
    data: T | null;
}

interface Timer {
    judging_timer: number;
}
