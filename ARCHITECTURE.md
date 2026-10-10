# FinPulse Architecture

## Domain Concepts

### User

A user is a person using FinPulse.

### Portfolio

A portfolio is a collection of a user's investments.

### Asset

An asset is something that can be invested in, such as AAPL, TSLA, NVDA, or MSFT.

### Holding

A holding represents how much of an asset a portfolio currently owns.

### Order

An order represents an instruction to buy or sell an asset.

## Relationships

- A user can have multiple portfolios.
- Each portfolio belongs to one user.
- A portfolio can have multiple holdings.
- A portfolio can have multiple orders.
- Each holding refers to one asset.
- Each order refers to one asset.
- Multiple portfolios can hold the same asset.

## Diagram

```text
users
  |
  +---- portfolios
             |
             +---- holdings ---- assets
             |
             +---- orders ------ assets