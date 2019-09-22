#!/usr/bin/env node

/**
 * Require dependencies
 */
const inquirer = require('inquirer');
const sh = require('shelljs');
const apt = require('apt');
const fs = require('fs-extra');
const chalk = require('chalk');
const path = require('path');
const high = require('highland');
const {installer, packager} = require('system-installer');

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
	red: {
		underline: style_error
	},
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
 * Process.pkg is set if it is run as a standalone executable packaged by pkg
 * In this case the repository has to be cloned to access all dotfiles
 *
 * @type {boolean}
 */
const PKG = process.pkg !== undefined;

/**
 * Defines if choices are checked by default
 *
 * @const {string | boolean}
 */
const DEFAULT_ON = process.env.SETUP_DEFAULT_ON || true;

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
const npmGlobalsStream = high(fs.createReadStream(path.join(__dirname, 'assets/npmGlobals'), 'utf8')).split();

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
	PKG ? console.log(style_attention('PKG RUN ---- run as standalone executable')) : '';

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
				new inquirer.Separator('== python modules =='),
				{
					name: 'saws',
					checked: DEFAULT_ON
				},
				{
					name: 'HTTPie',
					checked: DEFAULT_ON
				}
			],
			when: ans => ans && ans.prog !== undefined && ans.prog.includes('python')
		},
		{
			type: 'checkbox',
			name: 'python3Mods',
			message: `Select which ${style_attention('python3 modules')} to set up`,
			choices: [
				new inquirer.Separator('== python3 modules ==')
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
				/*{
					name: 'icdiff',
					checked: DEFAULT_ON
				},
				{
					name: 'taskwarrior',
					checked: DEFAULT_ON
				},
				{
					name: 'cherrytree',
					checked: DEFAULT_ON
				},
				{
					name: 'jq',
					checked: DEFAULT_ON
				},
				{
					name: 'gotty',
					checked: DEFAULT_ON
				},
				{
					name: 'aria2',
					checked: DEFAULT_ON
				},
				{
					name: 'ranger',
					checked: DEFAULT_ON
				},*/
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

	const DOTFILE_DIR = PKG ? path.join(HOME, '/.dotfiles/') : path.join(__dirname, '/../');

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
	stow('git');

	/**
	 * Clone .dotfiles repo to $HOME/.dotfiles if executed as package
	 */
	if (PKG) {
		try {
			console.log(style_running(`cloning repo to ${DOTFILE_DIR} ...`));
			exec(`git clone https://github.com/mmoehrlein/.dotfiles ${DOTFILE_DIR}`);
		} catch (error) {
			console.log(style_error('!!! Something went wrong cloning the dotfile repo !!!'));
			console.log(style_warn('Without the repo dotfiles cannot be stowed. No further execution possible.'));
			sh.exit(1);
		}
	}

	/**
	 * SHELLS SECTION
	 */
	if((answers.shells && (answers.shells.includes('zsh') || answers.shells.includes('bash')))
		|| (answers.rice && answers.rice.includes('oh-my-zsh'))){
		stow('shell');
	}
	/**
	 * Setting up bash
	 */
	if (answers.shells && answers.shells.includes('bash')) {
		try {
			console.log(style_running('removing default .bash_logout, .bashrc, .profile ...'));

			[path.join(HOME, '.bash_logout'), path.join(HOME, '.bashrc'), path.join(HOME, '.profile')].forEach(
				async value => DRY ? console.log(style_dry('$ rm ' + value)) : fs.remove(value)
			);
			stow('bash');
		} catch (error) {
			console.log(errorMsg('bash'));
		}
	} else {
		console.log(style_warn('WARNING: without bash setup zsh might not work correctly either'))
	}

	/**
	 * Setting up zsh
	 */
	if (answers.shells && answers.shells.includes('zsh') || answers.rice.includes('oh-my-zsh')) {
		try {
			stow('zsh');
			console.log(style_running('install zsh ...'));
			await aptInstall('zsh');
		} catch (error) {
			console.log(errorMsg('zsh'));
		}
	}

	/**
	 * RICE SECTION
	 */
	/**
	 * Setting up oh-my-zsh
	 */
	if (answers.rice && answers.rice.includes('oh-my-zsh')) {
		try {
			stow('oh-my-zsh');
			console.log(style_running('install oh-my-zsh ...'));
			exec('sh -c "$(wget https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"');
			console.log(style_running('install autosuggestions for zsh ...'));
			exec(`git clone https://github.com/zsh-users/zsh-autosuggestions \${ZSH_CUSTOM:-${HOME}/.oh-my-zsh/custom}/plugins/zsh-autosuggestions`);
			console.log(style_running('install syntax highlight for zsh ...'));
			exec(`git clone https://github.com/zsh-users/zsh-syntax-highlighting.git \${ZSH_CUSTOM:-${HOME}/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting`);
		} catch (error) {
			console.log(errorMsg('oh-my-zsh'));
		}
	} else {
		console.log(style_warn('WARNING: the zshrc is meant to be used with oh-my-sh'));
	}

	/**
	 * Setting up dircolors
	 */
	if (answers.rice && answers.rice.includes('dircolors')) {
		try {
			stow('dircolors');
		} catch (error) {
			console.log(errorMsg('dircolors'));
		}
	}

	/**
	 * Setting up base16_shell
	 */

	if (answers.rice && answers.rice.includes('base16_shell')) {
		try {
			console.log(style_running('cloning base16_shell ...'));
			exec(`git clone https://github.com/chriskempson/base16-shell.git ${path.join(HOME, '/.config/base16-shell')}`);
			stow('base16_shell');
		} catch (error) {
			console.log(errorMsg('base16_shell'));
		}
	}

	/**
	 * EDITORS SECTION
	 */
	/**
	 * Setting up vim
	 */
	if (answers.editors && answers.editors.includes('vim')) {
		try {
			stow('vim');
			console.log(style_running('installing vim ...'));
			await aptInstall('vim');
			console.log(style_running('installing vim plugins with vim plug ...'));
			exec(`/usr/bin/vim +PluginInstall +qall`);
		} catch (error) {
			console.log(errorMsg('vim'));
		}
	}

	/**
	 * Setting up neovim
	 */
	if (answers.editors && answers.editors.includes('neovim')) {
		try {
			stow('nvim');
			console.log(style_running('installing software-properties-common ...'));
			await aptInstall('software-properties-common');
			console.log(style_running('adding ppa repo ...'));
			exec('sudo apt-add-repository ppa:neovim-ppa/stable');
			await aptUpdate();
			console.log(style_running('installing neovim ...'));
			await aptInstall('neovim');
		} catch (error) {
			console.log(errorMsg('neovim'));
		}
	}

	/**
	 * PROGRAMMING LANGUAGES SECTION
	 */
	/**
	 * Setting up node with nvm
	 */
	if (answers.prog && answers.prog.includes('node')) {
		try {
			console.log(style_running('installing nvm and node ...'));
			exec(`curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.6/install.sh | bash`);
			exec('export NVM_DIR="$HOME/.nvm"');
			exec('[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"');
			exec('[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"');
			exec('nvm install node');
		} catch (error) {
			console.log(errorMsg('node'));
		}
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
	 * Installing global npm packages and writing them to ${HOME}/.npmGlobals
	 */
	if (answers.npmGlobals) {
		try {
			console.log(style_running('installing selected npm packages globally ...'));
			exec(`sudo npm i -g ${answers.npmGlobals.join(' ')}`);
			DRY ? `adding packages to ${path.join(HOME, '.npmGlobals')}` : fs.writeFile(path.join(HOME, '.npmGlobals'), answers.npmGlobals.join('\n'))
		} catch (error) {
			console.log(errorMsg('npmGlobals'));
		}
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
		try {
			console.log(style_running('installing fonts-font-awesome ...'));
			await aptInstall('fonts-font-awesome');
		} catch (error) {
			console.log(errorMsg('fonts-font-awesome'));
		}
	}

	/**
	 * Setting up UltimatePipes
	 */
	if (answers.other && answers.other.includes('ultimatePipe')) {
		try {
			console.log(style_running(`downloading ultimatePipe to ${path.join(HOME, 'bin')} ...`));
			exec(`curl -Lo ${path.join(HOME, 'bin/up')} https://github.com/akavel/up/releases/download/v0.3.2/up`);
			chmod0755.push(path.join(HOME, 'bin/up'));
		} catch (error) {
			console.log(errorMsg('ultimatePipe'));
		}
	}

	/**
	 * Setting up pipes.sh
	 */
	if (answers.other && answers.other.includes('pipes.sh')) {
		try {
			console.log(style_running(`downloading pipes.sh to ${path.join(HOME, 'bin')} as pipe ...`));
			exec(`curl -Lo ${path.join(HOME, 'bin/pipes')} https://raw.githubusercontent.com/pipeseroni/pipes.sh/master/pipes.sh`);
			chmod0755.push(`${path.join(HOME, 'bin/pipes')}`);
		} catch (error) {
			console.log(errorMsg('pipes.sh'));
		}
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
	if (DRY) {
		return console.log(style_dry('$ ' + cmd));
	} else {
		const res = sh.exec(cmd);
		if (res.code !== 0 || sh.error()) {
			throw new Error(res.stderr);
		}
		return res;
	}
}

/**
 * Stows the specified folder from $DOTFILE_DIR in $HOME
 *
 * @param folder    A folder in the dotfiles dir
 */
function stow(folder) {
	console.log(style_running(`stow ${folder} dotfiles ...`));
	exec(`stow -d ${DOTFILE_DIR} -t ${HOME} -S ${folder}`);
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
	return DRY ? console.log(style_dry(`$ ${packager().installercommand} ${pkg}`))
		: installer(pkg);
}

/**
 * Creates standard error message for a step
 *
 * @param pkg
 * @returns {string}
 */
function errorMsg(pkg) {
	return style_error(`!!! Something went wrong installing ${pkg} !!!`);
}
