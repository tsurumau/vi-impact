Vi Impact
=========

Description
-----------
Vi Impact is a yet another Vi clone written in JavaScript, uses function of [Impact Game Engine](http://impactjs.com).

It maybe called VIM(Vi IMpact) in short, but is irrelevant to VIM(Vi IMproved) although, in the future, VIM(Vi IMproved) commands would be ported.

Demo
----
This program is unstable and may have some bugs. Please refresh your browser if you are encountered with problems.

[Vi Impact demo](http://tsurumau.github.com/vi-impact/)

[It is also possible to pass a text](http://tsurumau.github.com/vi-impact/?foo%0abar%0abaz)


Installation
------------
If you would like to use this in local will you please download Impact and place it in the "lib" directory.

Currently Supported Vi Commands
-------------------------------

    h j k l <Space> 0 ^ $ + <CR> |
    f F t T w W
    i I a A o O x X
    dd

If you type in [count] command it may crush this program.

Features not in Vi
------------------

Command    |Description
-----------|----------------------
:set impact|This command will enable various visual effects if you are editing.
:set cat   |This will appear a cat.

ToDo
----

* The rest of Vi commands will be applied in the future.
* Texts will be entitized.

Acknowledge
-----------
Vi IMapct includes resources as follows.

[Cat Fighter Addon1 [ Energy Force Master Kit ]](http://opengameart.org/content/cat-fighter-addon1-energy-force-master-kit)

[Cat Fighter Addon2[ Assault Rifle Kit ]](http://opengameart.org/content/cat-fighter-addon2-assault-rifle-kit)

[Teleport Rune](http://opengameart.org/content/teleport-rune)

[explosion](http://opengameart.org/content/explosion)

[UI-Accept or Forward](http://opengameart.org/content/ui-accept-or-forward)

The [testem](https://github.com/airportyh/testem) was used for testing.
