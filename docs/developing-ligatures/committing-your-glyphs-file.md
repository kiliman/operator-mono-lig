# Committing your Glyphs file

The Glyphs file is very difficult to merge, so standard tools like `git rebase` don't work well. I have created some tools that will allow you to update your existing Glyphs file on top of the current.

{% hint style="warning" %}
Make sure you have created a separate branch for your changes and you've committed all your changes to the branch. 
{% endhint %}

1. When you're ready to issue a PR for your changes, you need to run the `./tools/glyphysrebase.sh` tool.
2. You can now create your PR, or continue making changes and running the rebase tool periodically to keep up-to-date with master.

## How the tool works

1. Checks out a clean copy of `master` in a temporary folder.
2. Copies your current working copy to a backup folder.
3. Copies the master copy into your working copy \(basically resetting everything back before your changes\).
4. Runs the `./tools/copyallglyphs.sh` script to copy ligatures from your backup folder to the current master in your working copy.
5. At this point, you now have a glyphs file that includes your custom ligatures on top of the current master.
6. The "rebased" files are then committed.
7. You can now issue a PR. This should easily merge into master.

