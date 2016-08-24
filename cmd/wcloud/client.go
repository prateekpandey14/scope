package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
)

// Client for the deployment service
type Client struct {
	token    string
	baseURL  string
	instance string // TODO: Use this in urls
	authType string
}

// NewClient makes a new Client
func NewClient(token, baseURL, instance string) (Client, error) {
	c := Client{
		token:    token,
		baseURL:  baseURL,
		instance: instance,
		authType: "Scope-User",
	}

	// TODO: Detect the type of token and get the instance id separately
	if instance == "" {
		err := c.getInstanceID()
		if err == ErrUnauthorized {
			c.authType = "Scope-Probe"
			err = c.getInstanceID()
		}
		if err != nil {
			return Client{}, err
		}
	}

	if c.authType == "Scope-User" {
		c.baseURL = fmt.Sprintf("%s/api/app/%s", c.baseURL, c.instance)
	}

	return c, nil
}

func (c *Client) getInstanceID() error {
	// User did not provide an instance, check if we can auto-detect only 1 instance
	req, err := http.NewRequest("GET", c.baseURL+"/api/users/lookup", nil)
	if err != nil {
		return err
	}
	req.Header.Add("Authorization", fmt.Sprintf("%s token=%s", c.authType, c.token))
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	if res.StatusCode == http.StatusUnauthorized {
		return ErrUnauthorized
	}
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("Error initializing client: %s\n", res.StatusCode)
	}

	defer res.Body.Close()
	var lookup lookupView
	if err := json.NewDecoder(res.Body).Decode(&lookup); err != nil {
		return err
	}
	if len(lookup.Instances) != 1 {
		return ErrMultipleInstances(lookup)
	}
	c.instance = lookup.Instances[0].ExternalID
	return nil
}

func (c Client) newRequest(method, path string, body io.Reader) (*http.Request, error) {
	req, err := http.NewRequest(method, c.baseURL+path, body)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", fmt.Sprintf("%s token=%s", c.authType, c.token))
	return req, nil
}

// Deploy notifies the deployment service about a new deployment
func (c Client) Deploy(deployment Deployment) error {
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(deployment); err != nil {
		return err
	}
	req, err := c.newRequest("POST", "/api/deploy/deploy", &buf)
	if err != nil {
		return err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	if res.StatusCode != 204 {
		return fmt.Errorf("Error making request: %s", res.Status)
	}
	return nil
}

// GetDeployments returns a list of deployments
func (c Client) GetDeployments(from, through int64) ([]Deployment, error) {
	req, err := c.newRequest("GET", fmt.Sprintf("/api/deploy/deploy?from=%d&through=%d", from, through), nil)
	if err != nil {
		return nil, err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("Error making request: %s", res.Status)
	}
	var response struct {
		Deployments []Deployment `json:"deployments"`
	}
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		return nil, err
	}
	return response.Deployments, nil
}

// GetEvents returns the raw events.
func (c Client) GetEvents(from, through int64) ([]byte, error) {
	req, err := c.newRequest("GET", fmt.Sprintf("/api/deploy/event?from=%d&through=%d", from, through), nil)
	if err != nil {
		return nil, err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("Error making request: %s", res.Status)
	}
	return ioutil.ReadAll(res.Body)
}

// GetConfig returns the current Config
func (c Client) GetConfig() (*Config, error) {
	req, err := c.newRequest("GET", "/api/config/deploy", nil)
	if err != nil {
		return nil, err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	if res.StatusCode == 404 {
		return nil, fmt.Errorf("No configuration uploaded yet.")
	}
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("Error making request: %s", res.Status)
	}
	var config Config
	if err := json.NewDecoder(res.Body).Decode(&config); err != nil {
		return nil, err
	}
	return &config, nil
}

// SetConfig sets the current Config
func (c Client) SetConfig(config *Config) error {
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(config); err != nil {
		return err
	}
	req, err := c.newRequest("POST", "/api/config/deploy", &buf)
	if err != nil {
		return err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	if res.StatusCode != 204 {
		return fmt.Errorf("Error making request: %s", res.Status)
	}
	return nil
}

// GetLogs returns the logs for a given deployment.
func (c Client) GetLogs(deployID string) ([]byte, error) {
	req, err := c.newRequest("GET", fmt.Sprintf("/api/deploy/deploy/%s/log", deployID), nil)
	if err != nil {
		return nil, err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("Error making request: %s", res.Status)
	}
	return ioutil.ReadAll(res.Body)
}
