import { render, screen } from '@/test/test-utils';
import Card from '@/app/components/Card';
import User from '@/models/User';

describe('Card', () => {
  const mockUser = new User('test-user', 'test-id');
  const mockText = 'Test message';

  it('renders user handle and message text', () => {
    render(<Card user={mockUser} text={mockText} />);

    expect(screen.getByRole('message-container')).toBeInTheDocument();
    expect(screen.getByAltText("test-user's avatar")).toBeInTheDocument();
  });

  it("displays default profile picture when user's fails to load", () => {
    render(<Card user={mockUser} text={mockText} />);
    expect(screen.getByRole('message-container')).toBeInTheDocument();
  });

  it('displays profile picture when available', () => {
    const userWithPicture = new User('test-user', 'test-id', '/test-pic.svg');
    render(<Card user={userWithPicture} text={mockText} />);

    const image = screen.getByAltText("test-user's avatar");
    expect(image).toHaveAttribute('src', '/test-pic.svg');
  });

  it('applies hover styles correctly', () => {
    const { container } = render(<Card user={mockUser} text={mockText} />);
    const cardElement = container.firstChild;

    expect(cardElement).toHaveClass('hover:bg-box-highlight');
  });
});
