apt install git

# cloning all the dotfiles
git clone git@github.com:mmoehrlein/.dotfiles.git ~/.dotfiles

# cloning base16_shell
git clone https://github.com/chriskempson/base16-shell.git ~/.config/base16-shell

# installing zsh and oh-my-zsh
apt install zsh
sh -c "$(wget https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O -)"

# cloning zsh-autosuggestions plugin
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# stowing all configs
apt install stow
stow -d ~/.dotfiles -t ~ -S *

