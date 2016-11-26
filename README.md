# Emojis Sprite Generator ![emoji](https://github.com/arthur-feral/emojis-sprites-generator/blob/master/tests/generator/imageGenerator/images/grinning-face.png)

### Introduction
Working in my company, I has to work on real time chat application and as a frontend engineer, they ask me to integrate an emojis popup to send emojis. The chat application works on both desktop and mobile. But emojis support is not great on all platforms and each has his own design. So to maximize the compatibility, the better way to have same emojis on all this platforms was sprites. So I've searched a place to find all emojis and their metadatas and came [Emojipedia.org](http://emojipedia.org/) and [Unicode.org](http://unicode.org/emoji/charts/full-emoji-list.html) gathering all i need for the job.

### Description

I wonder this module will make you save time. It's a NodeJS application wich generate emojis sprite for many themes:
`
'apple', 'emoji-one', 'emojidex', 'emojipedia', 'facebook', 'google', 'htc', 'lg', 'microsoft', 'mozilla', 'samsung', 'twitter', 'whatsapp'
`

Once the program finished the job, you will be able to get the files.
It stores raw images into a cache folder on the current working directory ordered by theme `cache/images/apple/` and by categories `cache/images/apple/people/`. All images have teh emoji's shortname as file name `cache/images/apple/people/grinning-face.png`, so you can use them into your mobile app for example. The size of images depend on the size you provide to the program.

It generates the sprite file with all emojis in the destination path you provide.

It also generate a stylesheet file (actually it just generate a less file, but other templates will come later). The file contains all emojis shortnames prefixed with the name you provide to the program.
```less
@emojiCharSize: 24px;

[class^="your-prefix-"], [class*=" your-prefix-"] {
    background: transparent url("final/path/apple.png") 0 0 no-repeat;
    display: inline-block;
    height: @emojiCharSize;
    background-size: 39381px 24px;
    width: @emojiCharSize;
    vertical-align: middle;
}

.your-prefix-grinning-face {
    background-position: -0 0;
}
.your-prefix-grinning-face-with-smiling-eyes {
    background-position: -24px 0;
}
// ...
```

It generate a json file containing all emoji's datas

```JSON
{
  "people": {
    "name": "people",
    "fullName": "Smileys & People",
    "emojis": [
      {
        "shortname": "grinning-face",
        "char": "😀",
        "category": "people",
        "fullName": "Grinning Face",
        "index": 0
      },
      {
        "shortname": "grinning-face-with-smiling-eyes",
        "char": "😁",
        "category": "people",
        "fullName": "Grinning Face With Smiling Eyes",
        "index": 1,
        "modifiers": [
            "others emojis here"
        ]
      },
```

of course you will find the modifiers version of emojis (black skin etc...). They are stored into the original emoji `modifiers` key if any. The modifiers versions of an emoji will have the same `index` key than the original.
- 🖕 Reversed Hand With Middle Finger Extended
- 🖕🏼 Reversed Hand With Middle Finger Extended, Type-3
- 🖕🏽 Reversed Hand With Middle Finger Extended, Type-4
- 🖕🏾 Reversed Hand With Middle Finger Extended, Type-5
- 🖕🏿 Reversed Hand With Middle Finger Extended, Type-6

### How to use
First install the package
```bash
$ npm i -g emojis-trainer
```

Run help command to have details
```bash
$ emojis-trainer -h
```

then launch it !
```bash
$ emojis-trainer --preproc less -d path/to/the/folder -s 24 -c
```
###Options
**preproc**

```--preproc``` the css preprocessor you want to use (REQUIRED). For now only sass and less are supported.

**destination**

```--destination``` the place when files will be writen (DEFAULT: current working directory)

**size**

```--size``` The sprite's height (DEFAULT: 24)

**prefix**

```--prefix``` The classnames prefix on stylesheet file (DEFAULT: emoji)

**cache**

```--cache``` Force using cache. In fact the program will get about 16k images and at least 1,7k html pages, so it caches datas on the first use and if you launch it again, it could use datas on the ``cache` folder. Don't use it if you want freash new datas from the websites. (DEFAULT: false)

# Notes
This is an early version. I know it needs some fixes and optimization but it works.
Don't hesitate to help ! ❤️

```javascript
return 'enjoy';
```
