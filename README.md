# .dotfiles
dotfiles for use with stow

## setup new machine
```bash
./bootstrap.sh
```
## file structure example for usage with stow
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
    └── zsh
        ├── .zprofile
        ├── .zshenv
        └── .zshrc
        
    if everything is stowed will link files to 
    
    ~
    ├── .bashrc
    ├── .profile
    ├── .gitconfig
    ├── .config
    │   ├── i3
    │   │   ├── config
    ├── .zshprofile
    ├── .zshenv
    └── .zshrc



