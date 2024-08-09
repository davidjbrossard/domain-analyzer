# domain-analyzer
A Node.JS app that parses an authorization domain and produces statistics

# What's an authorization domain?

# Instructions

## Domain analyzer action

This action prints "Hello World" or "Hello" + the name of a person to greet to the log.

### Inputs

#### `who-to-greet`

**Required** The name of the person to greet. Default `"World"`.

### Outputs

#### `time`

The time we greeted you.

### Example usage

```yaml
uses: actions/domain-analyzer@e76147da8e5c81eaf017dede5645551d4b94427b
with:
  who-to-greet: 'Mona the Octocat'
```
