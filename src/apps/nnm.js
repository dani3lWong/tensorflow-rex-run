import 'babel-polyfill';

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { Runner } from '../game';
import NNModel from '../ai/models/nn/NNModel';

let runner = null;

function setup() {
  // Initialize the game Runner.
  runner = new Runner('.game', {
    T_REX_COUNT: 3,
    onRestart: handleRestart,
    onCrash: handleCrash,
    onRunning: handleRunning
  });
  // Set runner as a global variable if you need runtime debugging.
  window.runner = runner;
  // Initialize everything in the game and start the game.
  runner.init();
}

function handleRestart(tRexes) {
  tRexes.forEach((tRex) => {
    if (!tRex.model) {
      // Initialize all the tRexes with random models
      // for the very first time.
      tRex.model = new NNModel();
      tRex.model.init();
      tRex.training = {
        inputs: [],
        labels: []
      };
    } else {
      // Train the model before restarting.
      tRex.model.train(tRex.training.inputs, tRex.training.labels);
    }
  });
}

function handleRunning({ tRex, state }) {
  return new Promise((resolve) => {
    if (!tRex.jumping) {
      let action = 0;
      const prediction = tRex.model.predictSingle(convertStateToVector(state));
      prediction.data().then((result) => {
        if (result[1] > result[0]) {
          action = 1;
          tRex.lastJumpingState = state;
        } else {
          tRex.lastRunningState = state;
        }
        resolve(action);
      });
    } else {
      resolve(0);
    }
  });
}

function handleCrash({ tRex }) {
  let input = null;
  let label = null;
  if (tRex.jumping) {
    input = convertStateToVector(tRex.lastJumpingState);
    label = [1, 0];
  } else {
    input = convertStateToVector(tRex.lastRunningState);
    label = [0, 1];
  }
  tRex.training.inputs.push(input);
  tRex.training.labels.push(label);
}

function convertStateToVector(state) {
  if (state) {
    return [
      state.obstacleX / CANVAS_WIDTH,
      state.obstacleWidth / CANVAS_WIDTH,
      state.speed / 100
    ];
  }
  return [0, 0, 0];
}

document.addEventListener('DOMContentLoaded', setup);
