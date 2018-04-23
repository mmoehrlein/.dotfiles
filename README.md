# .dotfiles
dotfiles for use with stow

## setup new machine
```bash
sudo apt install git stow
git clone https://github.com/mmoehrlein/.dotfiles.git ~/.dotfiles
stow -d ~/.dotfiles -t $HOME -S *
sudo apt install <everything else>
```
## file structure example
    dotfiles
    ├── bash
    │   ├── .bashrc
    │   └── .profile
    ├── git
    │   └── .gitconfig
    ├── i3
    │   ├── .config
    │   │   ├── i3
    │   │   │   └── config
    ├── zile
    │   └── .zile
    └── zsh
        ├── .zprofile
        ├── .zshenv
        └── .zshrc

