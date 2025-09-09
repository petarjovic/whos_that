CREATE TABLE IF NOT EXISTS games  (
    game_id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_name VARCHAR(20) NOT NULL,
    assets JSONB 
);

INSERT INTO games (game_name, assets) 
VALUES ('presidents', '{
    "Abraham Lincoln": "Abraham_Lincoln.jpg",
    "Andrew Jackson": "Andrew_Jackson.jpg",
    "Barack Obama": "Barack_Obama.jpg",
    "Bill Clinton": "Bill_Clinton.jpg",
    "Donald J Trump": "Donald_J_Trump.jpg",
    "Dwight D Eisenhower": "Dwight_D_Eisenhower.jpg",
    "Franklin D Roosevelt": "Franklin_D_Roosevelt.jpg",
    "George H W Bush": "George_H_W_Bush.jpg",
    "George W Bush": "George_W_Bush.jpeg",
    "George Washington": "George_Washington.jpg",
    "Harry Truman": "Harry_Truman.jpg",
    "James Madison": "James_Madison.jpg",
    "Jimmy Carter": "Jimmy_Carter.jpg",
    "Joe Biden": "Joe_Biden.jpg",
    "John F Kennedy": "John_F_Kennedy.jpg",
    "Lyndon B Johnson": "Lyndon_B_Johnson.jpg",
    "Richard Nixon": "Richard_Nixon.jpg",
    "Ronald Reagan": "Ronald_Reagan.jpg",
    "Theodore Roosevelt": "Theodore_Roosevelt.jpg",
    "Thomas Jefferson": "Thomas_Jefferson.jpg",
    "Ulysses S. Grant": "Ulysses_S._Grant.jpg",
    "Woodrow Wilson": "Woodrow_Wilson.jpg"
}')
