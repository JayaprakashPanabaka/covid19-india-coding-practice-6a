const express = require("express");
const app = express();
app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Error Message is ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1
// Path: /states/
// Method: GET
// Returns a list of all states in the state table

app.get("/states/", async (req, response) => {
  const getStateQuery = `
    SELECT * FROM state;
    `;
  const getStateQueryResponse = await db.all(getStateQuery);

  response.send(
    getStateQueryResponse.map((eachState) => {
      return {
        stateId: eachState.id,
        stateName: eachState.state_name,
        population: eachState.population,
      };
    })
  );
});

// API 2
// Path: /states/:stateId/
// Method: GET
// Returns a state based on the state ID

app.get("/states/:stateId", async (req, res) => {
  const { stateId } = req.params;

  const getStateIdQuery = `
    SELECT * FROM state
    WHERE state_id = ${stateId};
    `;
  const getStateIdQueryResponse = await db.get(getStateIdQuery);
  const stateIdData = getStateIdQueryResponse;
  res.send({
    stateId: stateIdData.state_id,
    stateName: stateIdData.state_name,
    population: stateIdData.population,
  });
});

// API 3
// Path: /districts/
// Method: POST
// Create a district in the district table, district_id is auto-incremented

app.post("/districts/", async (req, res) => {
  const { districtName, stateId, cases, cured, active, deaths } = req.body;

  const createDistrictQuery = `
    INSERT INTO district(
        district_name, state_id, cases, cured, active, deaths
    )
    VALUES(
        '${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths}
    );
    `;

  const createDistrictQueryResponse = await db.run(createDistrictQuery);

  res.send("District Successfully Added");
});

// API 4
// Path: /districts/:districtId/
// Method: GET
// Returns a district based on the district ID

app.get("/districts/:districtId", async (req, res) => {
  const { districtId } = req.params;

  const getDistQuery = `
    SELECT * FROM district
    WHERE district_id = ${districtId};
    `;

  const getDistQueryResponse = await db.get(getDistQuery);
  const getDistData = getDistQueryResponse;

  res.send({
    districtId: getDistData.district_id,
    districtName: getDistData.district_name,
    stateId: getDistData.state_id,
    cases: getDistData.cases,
    cured: getDistData.cured,
    active: getDistData.active,
    deaths: getDistData.deaths,
  });
});

// API 5
// Path: /districts/:districtId/
// Method: DELETE
// Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;

  const deleteDistQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};
    `;

  const deleteDistQueryResponse = await db.run(deleteDistQuery);
  res.send("District Removed");
});

// API 6
// Path: /districts/:districtId/
// Method: PUT
// Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (req, res) => {
  const { districtId } = req.params;
  const { districtName, stateId, cases, cured, active, deaths } = req.body;

  const updateDistQuery = `
    UPDATE district SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId};
    `;
  const updateDistQueryResponse = await db.run(updateDistQuery);

  res.send("District Details Updated");
});

// API 7
// Path: /states/:stateId/stats/
// Method: GET
// Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (req, res) => {
  const { stateId } = req.params;
  const getStatesByStatsQuery = `
    SELECT sum(cases) as totalCases, sum(cured) as totalCured, sum(active) as totalActive, sum(deaths) as totalDeaths FROM district
    WHERE state_id = ${stateId};
    `;

  const getStatesByStatsQueryResponse = await db.get(getStatesByStatsQuery);
  res.send(getStatesByStatsQueryResponse);
});

// API 8
// Path: /districts/:districtId/details/
// Method: GET
// Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details", async (req, res) => {
  const { districtId } = req.params;
  const getDistIdQuery = `
    SELECT state_id FROM district
    where district_id = ${districtId};
    `;
  const getDistIdQueryResponse = await db.get(getDistIdQuery);

  const getStateNameQuery = `
    SELECT state_name as stateName FROM state
    WHERE state_id = ${getDistIdQueryResponse.state_id};
    `;

  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  res.send(getStateNameQueryResponse);
});

app.get("/", (req, res) => {
  res.send("Hi Darling");
});

module.exports = app;
