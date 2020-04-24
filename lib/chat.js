function dispatchChatCommand(eventData, chatCommands) {
  const { channel, tags, message, self } = eventData;
  if (self) return;
  const [command, ...args] = message.split(' ');
  if (command.substr(0, 1) === '!') {
    const commandWord = command.substr(1);
    if (commandWord in chatCommands) {
      chatCommands[commandWord]({
        commandWord,
        args,
        ...eventData,
      });
    }
  }
}

module.exports = {
  dispatchChatCommand
};
