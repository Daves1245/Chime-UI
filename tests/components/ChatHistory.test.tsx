import { render, screen } from '@/test/test-utils';
import ChatHistory from '@/app/components/ChatHistory';
import User from '@/models/User';

describe('ChatHistory', () => {
  const mockMessages = [
    {
      text: 'Hello world',
      user: new User('user1', 'id1'),
      channel: 'general',
    },
    {
      text: 'How are you?',
      user: new User('user2', 'id2'),
      channel: 'general',
    },
  ];

  it('renders all messages', () => {
    render(<ChatHistory history={mockMessages} />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
  });

  it('renders empty state when no messages', () => {
    const { container } = render(<ChatHistory history={[]} />);

    expect(container.firstChild).toHaveClass('flex', 'flex-col', 'justify-end');
  });

  it('displays user handles for each message', () => {
    render(<ChatHistory history={mockMessages} />);

    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
  });
});
