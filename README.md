# Emojis Sprite Generator
I wonder this module will make you save time. It's a NodeJS application wich generate emojis sprite for many themes:
`
'apple', 'emoji-one', 'emojidex', 'emojipedia', 'facebook', 'google', 'htc', 'lg', 'microsoft', 'mozilla', 'samsung', 'twitter', 'whatsapp'
`

It generates a less file containing class names and background position according to its png sprite and a json file containing datas about emojis to be used in your javascript files.
The json file classify emojis into common categories.
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
        "index": 1
      },
      {
        "shortname": "face-with-tears-of-joy",
        "char": "😂",
        "category": "people",
        "fullName": "Face With Tears of Joy",
        "index": 2
      },
```

# How it works?
it just crawls [Emojipedia.org](http://emojipedia.org/) website, get the categories list on the main page, then for each, get the emojis list, and then for each emoji, get the images and some other meta datas. It also gets modifiers versions:
🖕 Reversed Hand With Middle Finger Extended
🖕🏼 Reversed Hand With Middle Finger Extended, Type-3
🖕🏽 Reversed Hand With Middle Finger Extended, Type-4
🖕🏾 Reversed Hand With Middle Finger Extended, Type-5
🖕🏿 Reversed Hand With Middle Finger Extended, Type-6

