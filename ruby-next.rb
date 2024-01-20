require "/bundle/setup"

# Make gem no-op
define_singleton_method(:gem) { |*| nil }

require "ruby-next/language"

SOURCE = <<~'RUBY'
  greet = proc do
    case it
      in hello: hello if hello =~ /human/i
        '🙂'
      in hello: 'martian'
        '👽'
      end
  end

  puts greet.call(hello: 'martian')
RUBY

puts RubyNext::Language.transform(SOURCE)
