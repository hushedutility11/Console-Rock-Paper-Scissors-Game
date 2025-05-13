#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

const HIGHSCORE_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.rps_highscores.json');

const choices = ['rock', 'paper', 'scissors'];

// Load high scores
async function loadHighScores() {
  try {
    const data = await fs.readFile(HIGHSCORE_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save high score
async function saveHighScore(score, name) {
  const highScores = await loadHighScores();
  highScores.push({ name, score, date: new Date().toISOString() });
  highScores.sort((a, b) => b.score - a.score); // Sort by score descending
  highScores.splice(5); // Keep top 5 scores
  await fs.writeFile(HIGHSCORE_FILE, JSON.stringify(highScores, null, 2));
}

// Display high scores
async function showHighScores() {
  const highScores = await loadHighScores();
  if (!highScores.length) {
    console.log(chalk.yellow('No high scores yet.'));
    return;
  }
  console.log(chalk.blue('High Scores:'));
  highScores.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.name} - ${entry.score} wins (${entry.date})`);
  });
}

// Reset high scores
async function resetHighScores() {
  await fs.writeFile(HIGHSCORE_FILE, JSON.stringify([], null, 2));
  console.log(chalk.green('High scores cleared!'));
}

// Get random computer choice
function getComputerChoice() {
  return choices[Math.floor(Math.random() * choices.length)];
}

// Determine winner
function determineWinner(player, computer) {
  if (player === computer) return 'draw';
  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) {
    return 'player';
  }
  return 'computer';
}

// Play a game round
async function playGame() {
  let playerScore = 0;
  let computerScore = 0;

  console.log(chalk.cyan('Welcome to Rock-Paper-Scissors!'));
  console.log(chalk.cyan('Choose rock, paper, or scissors to play against the computer.'));

  while (true) {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'Your choice:',
        choices: ['rock', 'paper', 'scissors', 'quit'],
      },
    ]);

    if (choice === 'quit') {
      console.log(chalk.blue(`Final Score: You ${playerScore} - Computer ${computerScore}`));
      if (playerScore > 0) {
        const { name } = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Enter your name to save your score:',
            default: 'Player',
          },
        ]);
        await saveHighScore(playerScore, name);
      }
      break;
    }

    const computerChoice = getComputerChoice();
    console.log(chalk.cyan(`You chose ${chalk.green(choice)}! Computer chose ${chalk.red(computerChoice)}!`));

    const result = determineWinner(choice, computerChoice);
    if (result === 'draw') {
      console.log(chalk.yellow('It\'s a draw!'));
    } else if (result === 'player') {
      playerScore++;
      console.log(chalk.green('You win this round!'));
    } else {
      computerScore++;
      console.log(chalk.red('Computer wins this round!'));
    }

    console.log(chalk.blue(`Score: You ${playerScore} - Computer ${computerScore}`));
  }
}

program
  .command('play')
  .description('Start a new game')
  .action(() => playGame());

program
  .command('highscore')
  .description('View high scores')
  .action(() => showHighScores());

program
  .command('reset')
  .description('Clear high scores')
  .action(() => resetHighScores());

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
  console.log(chalk.cyan('Use the "play" command to start the game!'));
}
