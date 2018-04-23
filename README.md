# .dotfiles
dotfiles for use with stow

```bash
sudo apt install git stow
git clone https://github.com/mmoehrlein/.dotfiles.git ~/.dotfiles
stow -d ~/.dotfiles -t $HOME -S *
```
