#!/usr/bin/env node

/**
 * Require dependencies
 */
const inquirer = require('inquirer');
const sh = require('shelljs');
const apt = require('apt');
const fs = require('fs-extra');
const high = require('highland');
const chalk = require('chalk');

/**
 * Define chalk styles
 *
 * @const {function}    style_notice        providing additional/optional info
 * @const {function}    style_attention     drawing the attention of the user
 * @const {function}    style_running       currently happening
 * @const {function}    style_warn          warning
 * @const {function}    style_dry           commands in dry run
 * @const {function}    style_welcome       welcome message
 */
const {
	gray: style_notice,
	magenta: style_attention,
	green: style_running,
	red: style_warn,
	yellow: style_dry,
	cyan: style_welcome
} = chalk;

/**
 * Can be passed to the script as an argument so a dry run is performed
 * In a dry run no actual commands are executed
 *
 * @const {boolean}
 * @example
 *      ./setup dry
 *      ./setup d
 */
const DRY = process.argv.includes('dry') || process.argv.includes('d');

/**
 * Defines if choices are checked by default
 *
 * @const {string | boolean}
 */
const DEFAULT_ON = process.env.SETUP_DEFAULT_ON || false;

/**
 * Get HOME from environment
 *
 * @type {string}
 */
let {HOME} = process.env;

/**
 * Saves the locations of all files that have to be chmod with 0755 for execution
 *
 * @type {[string]}
 */
let chmod0755 = [];

/**
 * reading the npmGlobals file from the repo
 *
 * @const {high} - gives easy access to convenient methods for transforming the stream
 */
const npmGlobalsStream = high(fs.createReadStream(`${__dirname}/assets/npmGlobals`, 'utf8')).split();

/**
 * Running the main function
 */
setup();

/**
 * Main function - implements all the worklflow
 * The workflow is wrapped in this function to be able to use async/await
 *
 * @returns {Promise<void>}
 */
async function setup() {
	const message = style_welcome(
		'╭──────────────────────────────────────────╮\n' +
		'│                                          │\n' +
		'│   Initial setup for new Linux Machines   │\n' +
		'│                                          │\n' +
		'╰──────────────────────────────────────────╯');
	console.log(message);
	DRY ? console.log(style_attention('DRY RUN ---- no commands are run, just printed to the terminal')) : '';

	/**
	 * A question
	 * @typedef {Object} Question
	 * @property {string} type
	 * @property {string} name
	 * @property {string} message
	 * @property {function} [when] - Basically work similarly to a filter. If true is returned it is printed otherwise not
	 * @property {[Choice | inquirer.Separator]} [choices] - In case the {@link Question} is a type of 'checkbox'
	 */

	/**
	 * A choice for {@link type}
	 * @typedef {Object} Choice
	 * @property {string} name
	 * @property {boolean} checked
	 * @property {function<boolean | string>} [disabled] - if a string is returned it will be used in prompt
	 */

	/**
	 * Array of questions to be asked be inquirer
	 *
	 * @type {[Question]}
	 */
	const questions = [
		{
			type: 'confirm',
			name: 'home:correct',
			message: `"${HOME}" is used as the home dir. Is this correct?`,
			when: () => HOME
		},
		{
			type: 'input',
			name: 'home:new',
			message: 'Enter another dir',
			when: ans => {
				return !ans['home:correct'] || !HOME;
			}
		},
		{
			type: 'checkbox',
			name: 'shells',
			message: `Select which ${style_attention('shells')} to set up`,
			choices: [
				new inquirer.Separator('== shells =='),
				{
					name: 'bash',
					checked: DEFAULT_ON
				},
				{
					name: 'zsh',
					checked: DEFAULT_ON
				}
			]
		},
		{
			type: 'checkbox',
			name: 'rice',
			message: `Select which ${style_attention('shell rice')} to set up`,
			choices: [
				new inquirer.Separator('== shell rice =='),
				{
					name: 'oh-my-zsh',
					checked: DEFAULT_ON,
					disabled: ans =>
						(!ans || ans.shells === undefined || !ans.shells.includes('zsh'))
							? style_notice('zsh was not selected previously') : false
				},
				{
					name: 'dircolors',
					checked: DEFAULT_ON
				},
				{
					name: 'base16_shell',
					checked: DEFAULT_ON
				}
			]
		},
		{
			type: 'checkbox',
			name: 'editors',
			message: `Select which ${style_attention('editors')} to set up`,
			choices: [
				new inquirer.Separator('== editors =='),
				{
					name: 'vim',
					checked: false
				},
				{
					name: 'neovim',
					checked: DEFAULT_ON
				}
			]
		},
		{
			type: 'checkbox',
			name: 'prog',
			message: `Select which ${style_attention('programming languages')} to set up`,
			choices: [
				new inquirer.Separator('== programming languages =='),
				{
					name: 'node',
					checked: DEFAULT_ON
				},
				{
					name: 'python',
					checked: DEFAULT_ON
				},
				{
					name: 'python3',
					checked: DEFAULT_ON
				}
			]
		},
		{
			type: 'checkbox',
			name: 'npmGlobals',
			message: `Select which ${style_attention('global npm modules')} to set up`,
			choices: [
				new inquirer.Separator('== global npm modules =='),
				...(await npmGlobalsStream.map(pkg => {
					return {name: pkg, checked: DEFAULT_ON}
				}).collect().toPromise(Promise))
			],
			when: ans => ans && ans.prog !== undefined && ans.prog.includes('node')
		},
		{
			type: 'checkbox',
			name: 'pythonMods',
			message: `Select which ${style_attention('python modules')} to set up`,
			choices: [
				new inquirer.Separator('== python modules ==')
			],
			when: ans => ans && ans.prog !== undefined && ans.prog.includes('python')
		},
		{
			type: 'checkbox',
			name: 'python3Mods',
			message: `Select which ${style_attention('python3 modules')} to set up`,
			choices: [
				new inquirer.Separator('== python3 modules =='),
				{
					name: 'saws',
					checked: DEFAULT_ON
				}
			],
			when: ans => ans && ans.prog !== undefined && ans.prog.includes('python3')
		},
		{
			type: 'checkbox',
			name: 'other',
			message: `Select which ${style_attention('other utils')} to set up`,
			choices: [
				new inquirer.Separator('== other utils =='),
				{
					name: 'fonts-font-awesome',
					checked: DEFAULT_ON
				},
				{
					name: 'ultimatePipe',
					checked: DEFAULT_ON
				},
				{
					name: 'pipes.sh',
					checked: DEFAULT_ON
				}

			]
		}
	];

	/**
	 * Calling and awaiting inquirer.prompt with the [{@link Question}] defined above
	 *
	 * @param {[Question]} questions
	 */
	const answers = await inquirer.prompt(questions);

	/**
	 * Overwrite HOME if userinput is present
	 */
	HOME = answers['home:new'] || HOME;

	/*let index;
	if ((index = answers.shells.indexOf('zsh')) >= 0 && answers.rice.indexOf('oh-my-zsh') >= 0) {
		answers.installs.splice(index, 1);
	}*/

	/**
	 * Updating and upgrading
	 */
	console.log(style_running('updating apt ...'));
	await aptUpdate();

	/**
	 * Setting up zsh
	 */
	console.log(style_running('installing stow and git ...'));
	await aptInstall('stow git');

	/**
	 * SHELLS SECTION
	 */
	/**
	 * Setting up bash
	 */
	if (answers.shells.includes('bash')) {
		console.log(style_running('removing default .bash_logout, .bashrc, .profile ...'));

		[`${HOME}/.bash_logout`, `${HOME}/.bashrc`, `${HOME}/.profile`].forEach(
			async value => DRY ? console.log(style_dry('$ rm ' + value)) : fs.remove(value)
		);
		console.log(style_running('stow bash dotfiles ...'));
		exec(`stow -d ${HOME}/.dotfiles -t ${HOME} -S bash`);
	} else {
		console.log(style_warn('WARNING: without bash setup zsh might not work correctly either'))
	}

	/**
	 * Setting up zsh
	 */
	if (answers.shells.includes('zsh') || answers.rice.includes('oh-my-zsh')) {
		console.log(style_running('stow zsh dotfiles ...'));
		exec(`stow -d ${HOME}/.dotfiles -t ${HOME} -S zsh`);
		console.log(style_running('install zsh ...'));
		await aptInstall('zsh');
	}

	/**
	 * RICE SECTION
	 */
	/**
	 * Setting up oh-my-zsh
	 */
	if (answers.rice.includes('oh-my-zsh')) {
		console.log(style_running('stow oh-my-zsh ...'));
		exec(`stow -d ${HOME}/.dotfiles -t ${HOME} -S oh-my-zsh`);
		console.log(style_running('install oh-my-zsh ...'));
		exec('sh -c "$(wget https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"');
		console.log(style_running('install autosuggestions for zsh ...'));
		exec('git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions');
	}

	/**
	 * Setting up dircolors
	 */
	if (answers.rice.includes('dircolors')) {
		console.log(style_running('stow .dircolors ...'));
		exec(`stow -d ${HOME}/.dotfiles -t ${HOME} -S dircolors`);
	}

	/**
	 * Setting up base16_shell
	 */

	if (answers.rice.includes('base16_shell')) {
		console.log(style_running('cloning base16_shell ...'));
		exec('git clone https://github.com/chriskempson/base16-shell.git ~/.config/base16-shell');
		console.log(style_running('stow base16_shell dotfiles ...'));
		exec(`stow -d ${HOME}/.dotfiles -t ${HOME}/ -S base16-shell`);
	}

	/**
	 * EDITORS SECTION
	 */
	let neo;
	/**
	 * Setting up vim
	 */
	if(answers.editors.includes('vim') || (neo = answers.editors.includes('neovim'))){
		console.log(style_running('cloning vundle ...'));
		exec(`git clone https://github.com/VundleVim/Vundle.vim.git ${HOME}/.vim/bundle/Vundle.vim`);
		console.log(style_running('stowing vim dotfiles ...'));
		exec(`stow -d ${HOME}/.dotfiles -t ${HOME} -S vim`);
		console.log(style_running('installing vim ...'));
		aptInstall('vim');
		console.log(style_running('installing vim plugins with vundle ...'));
		exec('vim +PluginInstall +qall');
	}

	/**
	 * Setting up neovim
	 */
	if(neo){
		console.log(style_running('stow nvim dotfiles ...'));
		exec(`stow -d ${HOME}/.dotfiles -t ${HOME} -S nvim`);
		console.log(style_running('installing software-properties-common ...'));
		aptInstall('software-properties-common');
		console.log(style_running('adding ppa repo ...'));
		exec('sudo apt-add-repository ppa:neovim-ppa/stable');
		aptUpdate();
		console.log(style_running('installing neovim ...'));
		aptInstall('neovim');
	}

	/**
	 * PROGRAMMING LANGUAGES SECTION
	 */
	/**
	 * Setting up node with nvm
	 */
	if (answers.prog && answers.prog.includes('node')) {
		console.log(style_running('installing nvm and node ...'));
		exec(`curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash && nvm install node`)
	}

	/**
	 * Setting up python and pip
	 */
	//TODO: add python

	/**
	 * setting up python3 and pip3
	 */
	//TODO: add python3

	/**
	 * NPM GLOBALS SECTION
	 */
	/**
	 * Installing global npm packages and writing them to ~/.npmGlobals
	 */
	if (answers.npmGlobals) {
		console.log(style_running('installing selected npm packages globally ...'));
		exec(`sudo npm i -g ${answers.npmGlobals.join(' ')}`);
		DRY ? 'adding packages to ~/.npmGlobals' : fs.writeFile(`${HOME}/.npmGlobals`, answers.npmGlobals.join('\n'))
	}

	/**
	 * PYTHON MODS SECTION
	 */

	/**
	 * PYTHON3 MODS SECTION
	 */
	/**
	 * Setting up saws
	 */
	//TODO add saws

	/**
	 * OTHER UTILS SECTION
	 */
	/**
	 * Setting up fonts-font-awesome
	 */
	if (answers.other && answers.other.includes('fonts-font-awesome')) {
		console.log(style_running('installing fonts-font-awesome ...'));
		aptInstall('fonts-font-awesome');
	}

	/**
	 * Setting up UltimatePipes
	 */
	if (answers.other && answers.other.includes('ultimatePipe')) {
		console.log(style_running('downloading ultimatePipe to ~/bin ...'));
		exec(`curl -Lo ${HOME}/bin/up https://github.com/akavel/up/releases/download/v0.3.2/up`);
		chmod0755.push(`${HOME}/bin/up`);
	}

	/**
	 * Setting up pipes.sh
	 */
	if (answers.other && answers.other.includes('pipes.sh')) {
		console.log(style_running('downloading pipes.sh to ~/bin as pipe ...'));
		exec(`curl -Lo ${HOME}/bin/pipes https://raw.githubusercontent.com/pipeseroni/pipes.sh/master/pipes.sh`);
		chmod0755.push(`${HOME}/bin/pipes`);
	}

	/**
	 * Changing file permissions
	 */
	if (chmod0755.length > 0) {
		console.log(style_running('setting execution permissions ...'));
		exec(`sudo chmod 0755 ${chmod0755.join(' ')}`);
	}
}

/**
 * Execute a command with shelljs or just print it to console if it is a dry run
 *
 * @param {String} cmd - the command that shall be executed
 * @example
 *      exec('ls');
 */
function exec(cmd) {
	DRY ? console.log(style_dry('$ ' + cmd)) : sh.exec(cmd);
}

/**
 * Asynchronous wrapper for apt.update() that only prints to console if it is a dry run
 *
 * @returns {Promise<*>}
 */
async function aptUpdate() {
	return DRY ? console.log(style_dry('$ sudo apt update')) : new Promise(resolve => apt.update(resolve));
}

/**
 * Asynchronous wrapper for apt.install() that only prints to console if it is a dry run
 *
 * @param {string} pkg
 * @returns {Promise<*>}
 */
async function aptInstall(pkg) {
	return DRY ? console.log(style_dry(`$ sudo apt install ${pkg} -y`)) : new Promise(resolve => apt.install(pkg, resolve));
}
