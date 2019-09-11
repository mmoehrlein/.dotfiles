# .dotfiles
dotfiles for use with stow

## setup new machine
```bash
cd setup && ./setup
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



