# Killed By Boris 

[https://KilledByBoris.UK](KilledByBoris.UK) & [https://KilledByBoris.com](KilledByBoris.com)

Static site to keep track of how many people Boris's incompetent handling of COVID has killed.

## Data

This pulls the data from https://api.coronatab.app/
who are in no way affiliated with this project

## Usage

### Installing, linting, building, testing

Use make

```
make {all,clean,install,lint,build,test}
```

### Deployment

This is handled by gitlab on merge to master

### Contributing

Submit a PR, if it fails linting or testing, it will be rejected

## TODO

* [] replace build script with webpack/similar
* [] replace npm with yarn/similar

## Built With

* [showdown](https://github.com/showdownjs/showdown) - Markdown converter written in Javascript
* [flag-icon-css](https://github.com/lipis/flag-icon-css) - A collection of all country flags in SVG
* Nothing else for now, mostly for performance and privacy of users.

## License

The project as a whole is licensed under the GPLv3+ - see the [COPYING.md](COPYING.md) file for details.
Although most of the content is probably not copyrightable or MIT