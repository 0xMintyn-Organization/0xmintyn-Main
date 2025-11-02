INSTRUCTIONS FOR AGENT:

Review the entire project structure before making ANY changes
Follow the existing pattern: marketplace backend has separate folders for models, routes, and controllers - all files prefixed with "marketplace"
ONLY implement what is explicitly asked - nothing more
When working on marketplace features, DO NOT modify other modules (governance, education, etc.)
Stick to the existing file naming and folder structure conventions
See the env base url it it has / at the end so dont add where you use api 
Always do handling of empty state, loading and error handle 
Do not make error do everything proper this is big scale project

ALWAYS CHECK REFERENCES BEFORE IMPLEMENTING:
When implementing similar features (e.g., ServiceGrid), ALWAYS check how existing similar components (e.g., ProductGrid) handle the same functionality
Copy the exact same patterns, helper functions, and data handling logic from reference components
Do not reinvent the wheel - reuse existing implementations

REUSE COMPONENTS AND UTILITIES:
Always reuse existing middleware (auth, error handling, catchAsyncError, etc.)
Always reuse existing utilities (errorHandler, JWT functions, database connections, etc.)
Always reuse existing helper functions and patterns across the codebase
Check if a similar function/middleware already exists before creating a new one
Maintain consistency by using the same approaches throughout the project

Do not change in used components of backend like controllers and routes unless they are neccasry to change 

make sure once you fixed and i said it is working now then do not touch it 