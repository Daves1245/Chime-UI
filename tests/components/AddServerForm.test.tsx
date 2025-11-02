import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import AddServerForm from '@/app/components/AddServerForm';

describe('AddServerForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders form fields', () => {
    render(<AddServerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByPlaceholderText('My Server')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('127.0.0.1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('8080')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<AddServerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', { name: 'Add Server' });
    expect(submitButton).toBeDisabled();

    // Clear and fill in valid data
    const nameInput = screen.getByPlaceholderText('My Server');
    const ipInput = screen.getByPlaceholderText('127.0.0.1');
    const portInput = screen.getByPlaceholderText('8080');

    await user.clear(nameInput);
    await user.clear(ipInput);
    await user.clear(portInput);

    await user.type(nameInput, 'Test Server');
    await user.type(ipInput, '127.0.0.1');
    await user.type(portInput, '8080');

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });

  it('shows validation errors for invalid input', async () => {
    const user = userEvent.setup();
    render(<AddServerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const ipInput = screen.getByPlaceholderText('127.0.0.1');
    const portInput = screen.getByPlaceholderText('8080');

    await user.clear(ipInput);
    await user.clear(portInput);
    await user.type(ipInput, 'invalid-ip');
    await user.type(portInput, '99999');

    await waitFor(() => {
      expect(screen.getByText('Invalid IP address')).toBeInTheDocument();
      expect(
        screen.getByText('Port must be between 1 and 65535')
      ).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<AddServerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
