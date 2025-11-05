export const mockAppointments = [
    {
      id: 1,
      date: "2024-08-25T14:30:00Z", // ISO 8601 format
      status: "ACCEPTED",
      caller: {
        firstName: "John",
        lastName: "Doe",
        profile: {
          location: "New York, USA",
        },
      },
    },
    {
      id: 2,
      date: "2024-08-26T10:00:00Z",
      status: "PENDING",
      caller: {
        firstName: "Jane",
        lastName: "Smith",
        profile: {
          location: "London, UK",
        },
      },
    },
    {
      id: 3,
      date: "2024-08-27T16:00:00Z",
      status: "CANCELLED",
      caller: {
        firstName: "Emily",
        lastName: "Johnson",
        profile: {
          location: "Sydney, Australia",
        },
      },
    },
    {
      id: 4,
      date: "2024-08-28T09:00:00Z",
      status: "ACCEPTED",
      caller: {
        firstName: "Michael",
        lastName: "Brown",
        profile: {
          location: "Toronto, Canada",
        },
      },
    },
    {
      id: 5,
      date: "2024-08-29T13:00:00Z",
      status: "PENDING",
      caller: {
        firstName: "Sophia",
        lastName: "Williams",
        profile: {
          location: "Berlin, Germany",
        },
      },
    },
  ];
  
  export default mockAppointments;
  