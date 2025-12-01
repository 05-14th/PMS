package device

type Repository interface {
	// Devices
	UpsertDevice(d *Device) error
	GetDevice(id string) (*Device, error)
	ListDevices() ([]*Device, error)

	// Command queue
	EnqueueCommand(deviceID string, cmd Command) error
	GetAndClearCommands(deviceID string) []Command
	AckCommand(deviceID, cmdID string) error
	GetQueueLen(deviceID string) int
}
