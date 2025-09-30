package logger

import (
	"os"

	"github.com/sirupsen/logrus"
)

// LoggerInterface defines the interface for a logger.
type LoggerInterface interface {
	WithField(key string, value interface{}) *logrus.Entry
	WithFields(fields logrus.Fields) *logrus.Entry
	WithError(err error) *logrus.Entry
	Info(args ...interface{})
	Error(args ...interface{})
	Warn(args ...interface{})
}

// Logger wraps logrus.Logger with additional functionality
type Logger struct {
	*logrus.Logger
}

// NewLogger creates a new logger instance
func NewLogger() *Logger {
	logger := logrus.New()
	
	// Set JSON formatter for production
	logger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: "2006-01-02 15:04:05",
	})
	
	// Set log level based on environment
	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}
	
	level, err := logrus.ParseLevel(logLevel)
	if err != nil {
		level = logrus.InfoLevel
	}
	logger.SetLevel(level)
	
	// Set output to stdout
	logger.SetOutput(os.Stdout)
	
	return &Logger{Logger: logger}
}

// WithField creates a new logger entry with a field
func (l *Logger) WithField(key string, value interface{}) *logrus.Entry {
	return l.Logger.WithField(key, value)
}

// WithFields creates a new logger entry with multiple fields
func (l *Logger) WithFields(fields logrus.Fields) *logrus.Entry {
	return l.Logger.WithFields(fields)
}

// WithError creates a new logger entry with an error field
func (l *Logger) WithError(err error) *logrus.Entry {
	return l.Logger.WithError(err)
}
