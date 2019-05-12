let express = require('express');
let _ = require('lodash');
let router = express.Router();
const factory = require('../connectors/index');

/*To Insert Deals in Database*/
router.post('/upload', async function (req, res, next) {
  try {
    const {currency, deals} = require('../deals');
    let db = await factory.createClient("orientDB");
    //cleanup;
    await db.command(`DELETE FROM Locations UNSAFE`);
    await db.command(`DELETE FROM TransitsTo UNSAFE`);
    let itineraries = {};
    let queries = [];
    deals.map(async item => {
      try {
        //DEPARTURES
        let key1 = item.departure.toUpperCase();
        //EDGE OUT
        let out1 = _.get(itineraries, `${key1}.out`, []);
        let edge = {
          key: item.arrival.toUpperCase(),
          arrival: item.arrival,
          duration: (parseInt(item.duration.h) * 60) + parseInt(item.duration.m),
          cost: item.cost,
          discount: item.discount,
          netCost: item.cost - item.discount,
          transport: item.transport,
          reference: item.reference
        };
        out1.push(edge);
        if (!itineraries[key1]) {
          //SORRY FOR THIS BUT THERE IS PROBLEM WITH DATABASE
          queries.push(`UPDATE Locations SET name = "${item.departure}" UPSERT WHERE name = "${item.departure}"`);
          // await db.command(`UPDATE Locations SET name = "${item.departure}" UPSERT WHERE name = "${item.departure}"`);
        }
        itineraries[key1] = {name: item.departure, out: out1};

        //ARRIVALS
        let key2 = item.arrival.toUpperCase();
        let out2 = _.get(itineraries, `${key2}.out`, []);
        if (!itineraries[key2]) {
          //SORRY FOR THIS BUT THERE IS PROBLEM WITH DATABASE
          queries.push(`UPDATE Locations SET name = "${item.arrival}" UPSERT WHERE name = "${item.arrival}"`);
          // await db.command(`UPDATE Locations SET name = "${item.departure}" UPSERT WHERE name = "${item.departure}"`);
        }
        queries.push(`CREATE EDGE TransitsTo 
        FROM (select from Locations WHERE name ="${item.departure}") 
        TO (select from Locations WHERE name ="${edge.arrival}") 
        SET 
        reference = "${edge.reference}",
        duration = ${edge.duration},
        cost = ${edge.cost},
        discount = ${edge.discount},
        netCost = ${edge.netCost},        
        transport = "${edge.transport}"`);

        itineraries[key2] = {name: item.arrival, out2};

      } catch (e) {
        console.log(e);
        return false;
      }
    });
    //SORRY FOR THIS BUT THERE IS PROBLEM WITH DATABASE
    let result = await queries.reduce((p, query) => (p).then(db.command(query)), Promise.resolve());
    db.close();
    res.send("Total Record Inserted: " + queries.length);
  }
  catch (e) {
    res.status(500).send(e);
  }

});


/* GET users listing. */
router.get('/search', async function (req, res, next) {
  // await db.query('SELECT expand(shortestPath) FROM (SELECT shortestPath((SELECT FROM Locations WHERE name = "London"),(SELECT FROM Locations WHERE name = "Paris"), \'OUT\',TransitsTo) as shortestPath)');
  try {
    let db = await factory.createClient("orientDB");
    let result = await db.query("select * from v");
    res.send(result);
    db.close();
  }
  catch (e) {
    res.status(500).send(e);
  }

});

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

module.exports = router;
