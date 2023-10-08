package config

import (
	"log"
	"os"
)

var requiredEnvs = [...]string{"JURY_ADMIN_PASSWORD", "EMAIL_FROM"}

// Checks to see if all required environmental variables are defined
func CheckEnv() {
	for _, v := range requiredEnvs {
		if !hasEnv(v) {
			log.Fatalf("%s environmental variable not defined\n", v)
		}
	}
}

// Returns true if the environmental variable is defined and not empty
func hasEnv(key string) bool {
	val, ok := os.LookupEnv(key)
	if !ok {
		return false
	}
	return val != ""
}

func GetEnv(key string) string {
	val, ok := os.LookupEnv(key)
	if !ok {
		log.Fatalf("%s environmental variable not defined\n", key)
		return ""
	}
	return val
}

func GetOptEnv(key string, defaultVal string) string {
	val, ok := os.LookupEnv(key)
	if !ok {
		return defaultVal
	}
	return val
}
