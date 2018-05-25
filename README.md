# .dotfiles
dotfiles for use with stow

## setup new machine
```bash
sudo apt install git
git clone git@github.com:mmoehrlein/.dotfiles.git ~/.dotfiles
.dotfiles/install.sh
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

