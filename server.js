import express from 'express';
import path from 'path';
import pg from 'pg';
import bodyParser from 'body-parser';
import { name } from 'ejs';
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const PORT = process.env.PORT || 3000;

const db = new pg.Client({
    // user: 'postgres',
    // host: 'localhost',
    // database: 'travel_india',
    // password: 'postgres16',
    // port: 5432,
    database_url: process.env.DATABASE_URL,
})
db.connect()

// Set the public folder as static
app.use(express.static(path.join('public')));


let user = {
    name: "John",
    color: "#D91656"
}

async function checkVisitedStates() {
    let state_code = [];
    const visited_states = (await db.query('SELECT state_code FROM visited_states')).rows;
    visited_states.forEach((state) => {
        state_code.push(state.state_code);
    });
    console.log(state_code);
    return state_code
}

app.get('/', async (req, res) => {

    const visitedStates = await checkVisitedStates()
    console.log(visitedStates);
    res.render("index.ejs", { state_code: visitedStates, user: user });
});

app.post('/add', async (req, res) => {
    const addState = req.body['state'].toLowerCase();
    console.log(addState);

    //? Fisrt try if the state name is complete and correct 
    try {
        const search = (await db.query('SELECT state_code FROM states WHERE LOWER(state_name) = $1', [addState]));
        const state_code = (search.rows[0].state_code);
        console.log(state_code);

        // Insert into visited States
        try {
            db.query('INSERT INTO visited_states(state_code) VALUES($1)', [state_code]);
        } catch (err) {
            console.log(err);
        }

        //? Check if state name is incomplete or incorrect 
    } catch (error) {
        try {
            const search = (await db.query("SELECT state_code FROM states WHERE LOWER(state_name) LIKE ('%' || $1 || '%')", [addState]));
            const state_code = (search.rows[0].state_code);

            console.log(state_code);

            // Insert into visited States
            try {
                db.query('INSERT INTO visited_states(state_code) VALUES($1)', [state_code]);
            } catch (err) {
                console.log(err);
            }

        } catch (error) {
            console.log("Error in second catch block");
            console.log(error);
        }
    }

    res.redirect('/');
})

app.post('/addByClick', async (req, res) => {
    const state = req.body['add']
    console.log(state);

    const check = await db.query('SELECT EXISTS(SELECT state_code FROM visited_states WHERE state_code = $1)', [state])

    if (check.rows[0].exists) {
        try {
            db.query('DELETE FROM visited_states WHERE state_code = $1', [state]);
        } catch (err) {
            console.log(err);
        }
    } else {
        try {
            db.query('INSERT INTO visited_states(state_code) VALUES($1)', [state]);
        } catch (err) {
            console.log(err);
        }
    }

    res.redirect('/')
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});