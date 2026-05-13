/**
 * module routes/states
 * author David A. Sowles
 * description    Defines the Express routing endpoints for managing US states data.
 */

// Our main web framework.
const express = require('express');
// Express routing instance to define endpoint paths and HTTP verbs.
const router = express.Router();
// Controller module managing the database and JSON retrieval logic.
const statesController = require('../controllers/statesController');


router.route('/')
    .get(statesController.getAllStates);

router.route('/:state')
    .get(statesController.getState);

router.route('/:state/funfact')
    .get(statesController.getRandomFunFact)
    .post(statesController.createFunFact)
    .patch(statesController.updateFunFact)
    .delete(statesController.deleteFunFact);

router.route('/:state/capital')
    .get(statesController.getStateCapital);

router.route('/:state/nickname')
    .get(statesController.getStateNickname);

router.route('/:state/population')
    .get(statesController.getStatePopulation);

router.route('/:state/admission')
    .get(statesController.getStateAdmission);

module.exports = router;