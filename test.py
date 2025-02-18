from edgar import *

# Tell the SEC who you are
set_identity("Michael Mccallum mike.mccalum@indigo.com")

filings = get_filings().next()
print(filings)
