/**
 * module controllers/statesController
 * author David A. Sowles
 * description   Controller containing route handler logic for fetching, 
 *               merging, and filtering US state data from MongoDB and local JSON.
 */

// The model for our MongoDB state data.
const State = require('../models/States');

// Local data store configuration caching state metadata from a static JSON file
const data = {
    states: require('../statesData.json'),
    setStates: function (data) { this.states = data }
};

const getAllStates = async (req, res) => {
    try {
        // Fetch all state documents from MongoDB to get the fun facts.
        const mongoStates = await State.find();

        // Merge the MongoDB fun facts with the local JSON data.
        let mergedStates = data.states.map(state => {
            const stateMatch = mongoStates.find(mongoState => mongoState.stateCode === state.code);
            // If we found a match in MongoDB and it has fun facts, add them to the state object.
            if (stateMatch && stateMatch.funfacts && stateMatch.funfacts.length > 0) {
                
                return { ...state, funfacts: stateMatch.funfacts };
            }
            return state; 
        });

        if (req.query.contig === 'true') {
            mergedStates = mergedStates.filter(st => st.code !== 'AK' && st.code !== 'HI');
        } else if (req.query.contig === 'false') {
            mergedStates = mergedStates.filter(st => st.code === 'AK' || st.code === 'HI');
        }

        res.json(mergedStates);

    } catch (err) {
        res.status(500).json({ 'message': err.message });
    }
}


const getState = async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = data.states.find(st => st.code === stateCode);
    
    if (!state) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    try {
        const mongoState = await State.findOne({ stateCode: stateCode });
        if (mongoState && mongoState.funfacts && mongoState.funfacts.length > 0) {
            // Append fun facts if they exist
            state.funfacts = mongoState.funfacts;
        }
        res.json(state); // All data for the state URL parameter [cite: 66]
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const getRandomFunFact = async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = data.states.find(st => st.code === stateCode);

    if (!state) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    try {
        const mongoState = await State.findOne({ stateCode: stateCode });
        if (mongoState && mongoState.funfacts && mongoState.funfacts.length > 0) {
            const randomIndex = Math.floor(Math.random() * mongoState.funfacts.length);
            res.json({ funfact: mongoState.funfacts[randomIndex] }); // A random fun fact [cite: 66]
        } else {
            res.status(404).json({ message: `No Fun Facts found for ${state.state}` });
        }
    } catch (err) {
         res.status(500).json({ message: err.message });
    }
};


const getStateCapital = (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = data.states.find(st => st.code === stateCode);
    if (!state) return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    res.json({ state: state.state, capital: state.capital_city }); // { 'state': stateName, 'capital': capitalName } [cite: 66]
};


const getStateNickname = (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = data.states.find(st => st.code === stateCode);
    if (!state) return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    res.json({ state: state.state, nickname: state.nickname }); // { 'state': stateName, 'nickname': nickname} [cite: 66]
};

const getStatePopulation = (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = data.states.find(st => st.code === stateCode);
    if (!state) return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    
    // Using toLocaleString() to format the number with commas 
    res.json({ state: state.state, population: state.population.toLocaleString() }); // { 'state': stateName, 'population': population } [cite: 66]
};


const getStateAdmission = (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const state = data.states.find(st => st.code === stateCode);
    if (!state) return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    res.json({ state: state.state, admitted: state.admission_date }); // { 'state': stateName, 'admitted': admissionDate } [cite: 66]
};


const createFunFact = async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    
    // Validate that the state exists in our JSON
    const isValidState = data.states.find(st => st.code === stateCode);
    if (!isValidState) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    // Validate the request body
    if (!req.body.funfacts) {
        return res.status(400).json({ message: 'State fun facts value required' });
    }
    if (!Array.isArray(req.body.funfacts)) {
        return res.status(400).json({ message: 'State fun facts value must be an array' });
    }

    try {
        // Find the state in MongoDB
        let state = await State.findOne({ stateCode: stateCode });

        if (!state) {
            // If the state isn't in MongoDB yet, create a new document
            state = await State.create({
                stateCode: stateCode,
                funfacts: req.body.funfacts
            });
        } else {
            // If it exists, push the new facts into the existing array
            state.funfacts.push(...req.body.funfacts);
            await state.save();
        }

        res.status(201).json(state);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const updateFunFact = async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    
    // Validate state
    const isValidState = data.states.find(st => st.code === stateCode);
    if (!isValidState) return res.status(404).json({ message: 'Invalid state abbreviation parameter' });

    // Validate body
    if (!req.body.index) return res.status(400).json({ message: 'State fun fact index value required' });
    if (!req.body.funfact) return res.status(400).json({ message: 'State fun fact value required' });

    try {
        const state = await State.findOne({ stateCode: stateCode });

        // Check if state exists in DB and has fun facts
        if (!state || !state.funfacts || state.funfacts.length === 0) {
            return res.status(404).json({ message: `No Fun Facts found for ${isValidState.state}` });
        }

        // Adjust for 0-based array (user sends 1, we need 0)
        const adjustedIndex = req.body.index - 1;

        // Check if index is out of bounds
        if (adjustedIndex < 0 || adjustedIndex >= state.funfacts.length) {
            return res.status(404).json({ message: `No Fun Fact found at that index for ${isValidState.state}` });
        }

        // Update the fact and save
        state.funfacts[adjustedIndex] = req.body.funfact;
        await state.save();

        res.json(state);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



const deleteFunFact = async (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    

    const isValidState = data.states.find(st => st.code === stateCode);
    if (!isValidState) return res.status(404).json({ message: 'Invalid state abbreviation parameter' });


    if (!req.body.index) return res.status(400).json({ message: 'State fun fact index value required' });

    try {
        const state = await State.findOne({ stateCode: stateCode });

        if (!state || !state.funfacts || state.funfacts.length === 0) {
            return res.status(404).json({ message: `No Fun Facts found for ${isValidState.state}` });
        }

        const adjustedIndex = req.body.index - 1;

        if (adjustedIndex < 0 || adjustedIndex >= state.funfacts.length) {
            return res.status(404).json({ message: `No Fun Fact found at that index for ${isValidState.state}` });
        }

        state.funfacts.splice(adjustedIndex, 1);
        await state.save();

        res.json(state);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllStates,
    getState,
    getRandomFunFact,
    getStateCapital,
    getStateNickname,
    getStatePopulation,
    getStateAdmission,
    createFunFact,
    updateFunFact,
    deleteFunFact
};