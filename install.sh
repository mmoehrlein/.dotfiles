#!/bin/bash
# install stow
sudo apt install stow -y

# replacing bash
sudo rm ~/.bash_logout
sudo rm ~/.bashrc
sudo rm ~/.profile
stow -d ~/.dotfiles -t ~ -S bash

# stowing .dircolors
stow -d ~/.dotfiles -t ~ -S dircolors

# cloning base16_shell
git clone https://github.com/chriskempson/base16-shell.git ~/.config/base16-shell
stow -d ~/.dotfiles -t ~ -S base16-shell

# installing zsh and oh-my-zsh
stow -d ~/.dotfiles -t ~ -S zsh
sudo apt install zsh -y
sh -c "$(wget https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
stow -d ~/.dotfiles -t ~ -S oh-my-zsh

# installing vim and Vundle
git clone https://github.com/VundleVim/Vundle.vim.git ~/.vim/bundle/Vundle.vim
stow -d ~/.dotfiles -t ~ -S vim
sudo apt install vim -y

# installing neovim
stow -d ~/.dotfiles -t ~ -S nvim
sudo apt install software-properties-common
sudo apt-add-repository ppa:neovim-ppa/stable
sudo apt update
sudo apt install neovim -y
# stowing all configs

stow -d ~/.dotfiles -t ~ -S ~/.dotfiles/**


echo "i3 is neither stowd nor installed"
