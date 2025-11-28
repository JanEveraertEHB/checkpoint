# Database Seed Files

This directory contains seed files to populate the database with test data for development and testing purposes.

## Available Seed Files

### `01_test_data.js` - Comprehensive Test Dataset
Creates a rich dataset with:
- **3 Teachers** with different classroom types
- **12 Students** with varying engagement levels (high, medium, low)
- **3 Classrooms**: Computer Science, Mathematics, Creative Writing
- **15 Checkpoints** across all classrooms
- **Student Progress**: Different completion levels per engagement
- **Feedback**: Varying detail levels (minimal, normal, detailed)
- **Feedback Requests**: Different response times and resolution status
- **Feedback Demands**: Various fulfillment rates
- **Pending Members**: For testing invitation system

### `02_quick_test.js` - Minimal Quick Test Dataset
Creates a focused dataset with:
- **1 Teacher**: Test Teacher
- **3 Students**: High, Medium, Low engagement levels
- **1 Classroom**: Test Classroom
- **3 Checkpoints**: Simple progression
- **Student Progress**: Clear engagement differences
- **Feedback**: Different detail levels
- **Feedback Requests**: Varying recency and resolution
- Perfect for testing engagement metrics and student ranking

## Usage


### Quick Test (Recommended for development)
```bash
npm run seed:test
```

### Full Test Dataset
```bash
npm run seed:full
```

### List Available Seeds
```bash
npm run seed
```

## Test Data Characteristics

### Student Engagement Levels

#### High Engagement Students
- **Checkpoint Progress**: Complete most/all checkpoints
- **Feedback Content**: Detailed (500+ characters)
- **Response Time**: Fast (within 24 hours)
- **Recent Activity**: Active within last week
- **Overall Score**: 80-100

#### Medium Engagement Students  
- **Checkpoint Progress**: Complete 50-75% of checkpoints
- **Feedback Content**: Normal (100-500 characters)
- **Response Time**: Average (1-3 days)
- **Recent Activity**: Some activity within last week
- **Overall Score**: 40-79

#### Low Engagement Students
- **Checkpoint Progress**: Complete 0-25% of checkpoints  
- **Feedback Content**: Minimal (<100 characters)
- **Response Time**: Slow (3+ days or no response)
- **Recent Activity**: No activity in last week
- **Overall Score**: 0-39

### Login Credentials

#### Teachers
- **Email**: Various `@school.edu` addresses
- **Password**: `teacher123`

#### Students  
- **Email**: Various `@student.edu` addresses
- **Password**: `student123`

### Classroom Invite Codes
- **CS101FALL**: Introduction to Computer Science
- **MATH301SPR**: Advanced Mathematics  
- **ENG200FALL**: Creative Writing Workshop
- **TEST123**: Test Classroom (quick seed)

## Testing Scenarios

The seed data enables testing of:

### ✅ Basic Functionality
- User registration and login
- Classroom creation and joining
- Checkpoint creation and completion
- Basic feedback system

### ✅ Advanced Features
- **Student Engagement Metrics**: Different engagement levels
- **Progress Tracking**: Checkpoint completion rates
- **Feedback Analysis**: Content length and response times
- **Priority Ranking**: Students sorted by engagement score

### ✅ Edge Cases
- **Inactive Students**: No recent activity
- **Unresolved Requests**: Outstanding feedback requests
- **Pending Members**: Invitation system testing
- **Empty States**: Classrooms without checkpoints

### ✅ Performance Testing
- **Multiple Classrooms**: Cross-classroom data
- **Large Datasets**: 12+ students per classroom
- **Complex Queries**: Engagement calculations
- **Concurrent Access**: Multiple teachers/students

## Data Relationships

```
Users (Teachers & Students)
    ↓
Classroom Memberships (Roles & Active Status)
    ↓
Classrooms (with Invite Codes)
    ↓
Checkpoints (Ordered Progression)
    ↓
Student Checkpoints (Progress Tracking)
    ↓
Feedback (Teacher → Student)
    ↓
Feedback Requests (Student → Teacher)
    ↓
Feedback Demands (Teacher → Student)
```

## Development Workflow

1. **Fresh Database**: Start with clean state
2. **Run Migrations**: Ensure latest schema
3. **Choose Seed**: Quick test or full dataset
4. **Test Features**: Verify functionality
5. **Reset & Repeat**: Clean slate for new tests

## Notes

- All passwords are hashed using bcrypt
- UUIDs are generated for all entities
- Dates are realistic (spread over last 3 months)
- Email domains follow academic patterns
- Content reflects realistic educational scenarios
- Engagement levels are clearly differentiated for testing

This seed data provides comprehensive coverage for testing all platform features, especially the new student engagement metrics system.